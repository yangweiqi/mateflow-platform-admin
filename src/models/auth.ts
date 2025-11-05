/**
 * Authentication state management model with advanced features
 */
import type { SignInByEmailReqBody, SuperAdminInfo } from '@/services';
import {
  accountServiceGetAdminMe,
  accountServiceRefreshToken,
  accountServiceSignInByEmail,
  accountServiceSignOut,
} from '@/services';
import {
  clearAuth,
  getRememberMe,
  getSessionDuration,
  getTimeUntilExpiration,
  getToken,
  getUserEmail,
  hasSessionTimedOut,
  isSessionNearTimeout,
  isTokenExpired,
  setRememberMe,
  setSessionStart,
  setToken,
  setUserEmail,
  shouldRefreshToken,
} from '@/utils/auth';
import { LoginRateLimiter } from '@/utils/rateLimiter';
import { SecurityAuditLogger } from '@/utils/securityAudit';
import { SessionSecurityManager } from '@/utils/sessionSecurity';
import { App } from 'antd';
import { useEffect, useRef, useState } from 'react';

export interface CurrentUser {
  email?: string;
  token?: string;
  adminInfo?: SuperAdminInfo;
}

const MAX_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const TOKEN_REFRESH_CHECK_INTERVAL = 60 * 1000; // Check every minute

export default function useAuthModel() {
  const { message } = App.useApp();
  const [currentUser, setCurrentUser] = useState<CurrentUser | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  /**
   * Stop all timers
   */
  const stopTimers = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  /**
   * Refresh token using current access token
   * Backend uses the existing token to issue a new one
   */
  const refreshToken = async () => {
    try {
      // Call refresh endpoint - it will use the current token from Authorization header
      const response = await accountServiceRefreshToken();

      if (response.data?.code === 0 && response.data?.data?.token) {
        // Store new access token
        setToken(response.data.data.token, response.data.data.expires_at);

        // Update current user with new token
        setCurrentUser((prev) => ({
          ...prev,
          token: response.data?.data?.token,
        }));

        return response.data.data.token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };

  /**
   * Sign out with token revocation
   */
  const signOut = async (revokeToken: boolean = true) => {
    setLoading(true);

    // Log logout
    SecurityAuditLogger.logLogout(currentUser?.email);

    try {
      if (revokeToken) {
        // Call API to revoke token on server
        await accountServiceSignOut();
      }

      // Stop all timers
      stopTimers();

      // Clear session security data
      SessionSecurityManager.clearSession();

      // Clear all auth data
      clearAuth();
      setCurrentUser(undefined);
      setShowTimeoutWarning(false);

      message.success('Logged out successfully');
      return true;
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local auth even if API call fails
      stopTimers();
      SessionSecurityManager.clearSession();
      clearAuth();
      setCurrentUser(undefined);
      setShowTimeoutWarning(false);
      return true;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start automatic token refresh timer
   */
  const startAutoRefresh = () => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Check token refresh status periodically
    refreshTimerRef.current = setInterval(async () => {
      // Don't refresh if already refreshing
      if (isRefreshingRef.current) {
        return;
      }

      // Check if token needs refresh
      if (shouldRefreshToken()) {
        console.log('Token needs refresh, refreshing automatically...');
        isRefreshingRef.current = true;
        const newToken = await refreshToken();
        isRefreshingRef.current = false;

        if (newToken) {
          console.log('Token refreshed successfully');
        } else {
          console.log('Token refresh failed');
          // If refresh fails and we don't have remember me, logout
          if (!getRememberMe()) {
            message.error('Session expired, please login again');
            await signOut();
          }
        }
      }
    }, TOKEN_REFRESH_CHECK_INTERVAL);
  };

  /**
   * Start session timeout monitoring
   */
  const startSessionMonitoring = () => {
    // Clear existing timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    // Check session timeout status periodically
    sessionTimerRef.current = setInterval(() => {
      if (hasSessionTimedOut(MAX_SESSION_DURATION)) {
        setShowTimeoutWarning(false);
        message.warning('Session timed out due to inactivity');
        signOut();
        return;
      }

      if (isSessionNearTimeout(MAX_SESSION_DURATION)) {
        const remaining = MAX_SESSION_DURATION - getSessionDuration();
        setTimeRemaining(remaining);
        setShowTimeoutWarning(true);
      }
    }, 10000); // Check every 10 seconds
  };

  /**
   * Fetch current admin user information
   * @param updateState - Whether to update the currentUser state (default: false for backward compatibility)
   */
  const fetchAdminMe = async (updateState: boolean = false) => {
    try {
      const response = await accountServiceGetAdminMe();

      if (response.data?.code === 0 && response.data?.data) {
        const adminInfo = response.data.data;

        // Update currentUser state if requested
        if (updateState) {
          setCurrentUser((prev) => ({
            ...prev,
            adminInfo,
          }));
        }

        return adminInfo;
      }
      return null;
    } catch (error: any) {
      console.error('Fetch admin info error:', error);
      // Note: Error handling (401, 403, etc.) is done by the client error interceptor
      // or can be wrapped with apiResponseHandler if needed
      return null;
    }
  };

  /**
   * Sign in with email and password
   * @returns CurrentUser object on success, false on failure
   */
  const signIn = async (
    credentials: SignInByEmailReqBody,
    rememberMe: boolean = false,
  ): Promise<CurrentUser | false> => {
    setLoading(true);

    // Log login attempt
    if (credentials.email) {
      SecurityAuditLogger.logLoginAttempt(credentials.email, {
        hasCaptcha: !!credentials.captcha_token,
        hasDeviceFingerprint: !!credentials.device_fingerprint,
      });
    }

    try {
      const response = await accountServiceSignInByEmail({
        body: credentials,
      });

      if (response.data?.data?.token) {
        // Clear rate limiting on successful login
        if (credentials.email) {
          LoginRateLimiter.clearAttempts(credentials.email);
          SecurityAuditLogger.logLoginSuccess(credentials.email);
        }

        // Store access token with expiration if provided
        setToken(response.data.data.token, response.data.data.expires_at);

        // Store user email for persistence
        if (credentials.email) {
          setUserEmail(credentials.email);
        }

        // Store remember me preference
        // With remember me, we'll keep refreshing the token automatically
        setRememberMe(rememberMe);

        // Set session start time
        setSessionStart();

        // Create secure session
        await SessionSecurityManager.createSession();

        // Fetch admin info after successful login
        const adminInfo = await fetchAdminMe();

        // Create user object
        const userInfo: CurrentUser = {
          email: credentials.email,
          token: response.data.data.token,
          adminInfo: adminInfo || undefined,
        };

        // Update current user state
        setCurrentUser(userInfo);

        // Start automatic refresh and session monitoring
        startAutoRefresh();
        startSessionMonitoring();

        message.success('Login successful!');
        return userInfo;
      } else {
        // Log failed login
        if (credentials.email) {
          SecurityAuditLogger.logLoginFailure(
            credentials.email,
            response.data?.msg || 'Invalid credentials',
          );
        }
        message.error(response.data?.msg || 'Login failed');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Log failed login
      if (credentials.email) {
        SecurityAuditLogger.logLoginFailure(
          credentials.email,
          error?.msg || error?.message || 'Unknown error',
        );
      }

      message.error(error?.msg || error?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check and refresh token if needed
   */
  const checkAndRefreshToken = async () => {
    const token = getToken();
    if (!token) {
      return null;
    }

    if (isTokenExpired()) {
      return await refreshToken();
    }

    return token;
  };

  /**
   * Initialize user from stored token
   */
  const initUser = async () => {
    const token = await checkAndRefreshToken();
    if (token) {
      // Validate session security
      const validation = await SessionSecurityManager.validateSession();
      if (!validation.valid) {
        console.warn(
          '[Security] Session validation failed:',
          validation.reason,
        );
        SecurityAuditLogger.logSuspiciousActivity(
          validation.reason || 'Session validation failed',
        );

        // Clear invalid session
        await signOut(false);
        message.warning(
          'Session security validation failed. Please login again.',
        );
        return false;
      }

      // Load email from storage
      const email = getUserEmail();

      // Fetch admin info
      const adminInfo = await fetchAdminMe();

      setCurrentUser({
        token,
        email: email || undefined,
        adminInfo: adminInfo || undefined,
      });

      // Start timers if user is authenticated
      startAutoRefresh();
      startSessionMonitoring();

      return true;
    }
    return false;
  };

  /**
   * Extend session (reset session timer)
   */
  const extendSession = async () => {
    setShowTimeoutWarning(false);
    setSessionStart(); // Reset session start time

    // Also refresh token to get a fresh one
    const newToken = await refreshToken();
    if (newToken) {
      message.success('Session extended successfully');
    } else {
      message.warning('Session extended, but token refresh failed');
    }
  };

  /**
   * Get session info for display
   */
  const getSessionInfo = () => {
    return {
      duration: getSessionDuration(),
      timeUntilExpiration: getTimeUntilExpiration(),
      rememberMe: getRememberMe(),
    };
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, []);

  return {
    currentUser,
    loading,
    showTimeoutWarning,
    timeRemaining,
    signIn,
    signOut,
    refreshToken,
    checkAndRefreshToken,
    initUser,
    extendSession,
    getSessionInfo,
    setShowTimeoutWarning,
    fetchAdminMe,
  };
}
