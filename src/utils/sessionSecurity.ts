/**
 * Session Security Manager
 * Provides additional session validation and security checks
 */

import {
  getDeviceFingerprint,
  getStoredDeviceFingerprint,
  storeDeviceFingerprint,
} from './deviceFingerprint';

export interface SessionSecurityConfig {
  maxConcurrentSessions: number;
  requireReauthForSensitiveOps: boolean;
  validateDeviceFingerprint: boolean;
  trackSessionActivity: boolean;
}

export interface SessionInfo {
  id: string;
  createdAt: string;
  lastActivity: string;
  deviceFingerprint?: string;
  userAgent: string;
}

const DEFAULT_CONFIG: SessionSecurityConfig = {
  maxConcurrentSessions: 3,
  requireReauthForSensitiveOps: true,
  validateDeviceFingerprint: true,
  trackSessionActivity: true,
};

export class SessionSecurityManager {
  private static SESSION_DEVICE_KEY = 'session_device';
  private static SESSION_CREATED_KEY = 'session_created_at';
  private static SESSION_LAST_ACTIVITY_KEY = 'session_last_activity';
  private static SESSION_ID_KEY = 'session_id';
  private static config: SessionSecurityConfig = DEFAULT_CONFIG;

  /**
   * Initialize session security configuration
   */
  static configure(config: Partial<SessionSecurityConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current configuration
   */
  static getConfig(): SessionSecurityConfig {
    return { ...this.config };
  }

  /**
   * Validate current session
   * Returns true if session is valid, false if suspicious
   */
  static async validateSession(): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Check device fingerprint if enabled
      if (this.config.validateDeviceFingerprint) {
        const deviceInfo = await getDeviceFingerprint();
        const storedDevice = getStoredDeviceFingerprint();

        if (storedDevice && storedDevice !== deviceInfo.fingerprint) {
          console.warn('[Security] Device fingerprint mismatch');
          return {
            valid: false,
            reason: 'Device fingerprint mismatch - possible session hijacking',
          };
        }
      }

      // Check session age (optional additional validation)
      const createdAt = this.getSessionCreatedAt();
      if (createdAt) {
        const age = Date.now() - new Date(createdAt).getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (age > maxAge) {
          return {
            valid: false,
            reason: 'Session too old - please re-authenticate',
          };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Session validation error:', error);
      // Allow session on error to avoid blocking legitimate users
      return { valid: true };
    }
  }

  /**
   * Create a new session
   */
  static async createSession(): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    try {
      localStorage.setItem(this.SESSION_ID_KEY, sessionId);
      localStorage.setItem(this.SESSION_CREATED_KEY, now);
      localStorage.setItem(this.SESSION_LAST_ACTIVITY_KEY, now);

      if (this.config.validateDeviceFingerprint) {
        try {
          const deviceInfo = await getDeviceFingerprint();
          storeDeviceFingerprint(deviceInfo.fingerprint);
          localStorage.setItem(this.SESSION_DEVICE_KEY, deviceInfo.fingerprint);
        } catch (fingerprintError) {
          console.warn(
            'Failed to generate device fingerprint during session creation:',
            fingerprintError,
          );
          // Continue without device fingerprint rather than failing session creation
        }
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }

    return sessionId;
  }

  /**
   * Update session activity timestamp
   */
  static updateActivity(): void {
    if (!this.config.trackSessionActivity) return;

    try {
      localStorage.setItem(
        this.SESSION_LAST_ACTIVITY_KEY,
        new Date().toISOString(),
      );
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_ID_KEY);
      localStorage.removeItem(this.SESSION_CREATED_KEY);
      localStorage.removeItem(this.SESSION_LAST_ACTIVITY_KEY);
      localStorage.removeItem(this.SESSION_DEVICE_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Get current session info
   */
  static getSessionInfo(): SessionInfo | null {
    try {
      const id = localStorage.getItem(this.SESSION_ID_KEY);
      const createdAt = localStorage.getItem(this.SESSION_CREATED_KEY);
      const lastActivity = localStorage.getItem(this.SESSION_LAST_ACTIVITY_KEY);
      const deviceFingerprint = localStorage.getItem(this.SESSION_DEVICE_KEY);

      if (!id || !createdAt) return null;

      return {
        id,
        createdAt,
        lastActivity: lastActivity || createdAt,
        deviceFingerprint: deviceFingerprint || undefined,
        userAgent: navigator.userAgent,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get session age in milliseconds
   */
  static getSessionAge(): number {
    const createdAt = this.getSessionCreatedAt();
    if (!createdAt) return 0;
    return Date.now() - new Date(createdAt).getTime();
  }

  /**
   * Get time since last activity in milliseconds
   */
  static getTimeSinceLastActivity(): number {
    try {
      const lastActivity = localStorage.getItem(this.SESSION_LAST_ACTIVITY_KEY);
      if (!lastActivity) return 0;
      return Date.now() - new Date(lastActivity).getTime();
    } catch {
      return 0;
    }
  }

  /**
   * Check if session is idle
   */
  static isSessionIdle(idleThreshold: number = 30 * 60 * 1000): boolean {
    return this.getTimeSinceLastActivity() > idleThreshold;
  }

  /**
   * Generate a unique session ID
   */
  private static generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }

  /**
   * Get session created timestamp
   */
  private static getSessionCreatedAt(): string | null {
    try {
      return localStorage.getItem(this.SESSION_CREATED_KEY);
    } catch {
      return null;
    }
  }
}

/**
 * Activity tracker for automatic session updates
 */
export class SessionActivityTracker {
  private static eventListeners: Array<() => void> = [];
  private static isTracking = false;
  private static throttleTimeout: NodeJS.Timeout | null = null;
  private static throttleDelay = 60000; // Update at most once per minute

  /**
   * Start tracking user activity
   */
  static start(): void {
    if (this.isTracking) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const throttledUpdate = () => {
      if (this.throttleTimeout) return;

      SessionSecurityManager.updateActivity();

      this.throttleTimeout = setTimeout(() => {
        this.throttleTimeout = null;
      }, this.throttleDelay);
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledUpdate, { passive: true });
      this.eventListeners.push(() => {
        window.removeEventListener(event, throttledUpdate);
      });
    });

    this.isTracking = true;
  }

  /**
   * Stop tracking user activity
   */
  static stop(): void {
    if (!this.isTracking) return;

    this.eventListeners.forEach((removeListener) => removeListener());
    this.eventListeners = [];

    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }

    this.isTracking = false;
  }
}
