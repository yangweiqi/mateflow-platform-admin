/**
 * Authentication utility functions
 * Handles token storage, retrieval, and management
 *
 * Supports both localStorage and secure cookies for token storage.
 * Use cookies for production environments (more secure with httpOnly support from backend).
 */

import {
  areCookiesEnabled,
  deleteCookie,
  getCookie,
  setCookie,
} from './cookies';

// Storage keys
// When using cookies, token key must be 'jwt' for backend compatibility
const TOKEN_KEY = 'admin_token'; // localStorage key
const TOKEN_KEY_COOKIE = 'jwt'; // Cookie key (required by backend)
const TOKEN_EXPIRES_KEY = 'admin_token_expires';
const REMEMBER_ME_KEY = 'admin_remember_me';
const SESSION_START_KEY = 'admin_session_start';
const USER_EMAIL_KEY = 'admin_user_email';

// Storage strategy: 'localStorage' or 'cookie'
// Set to 'cookie' for production (more secure)
// Note: True httpOnly cookies should be set by the backend
const STORAGE_STRATEGY: 'localStorage' | 'cookie' =
  typeof window !== 'undefined' && areCookiesEnabled()
    ? 'cookie'
    : 'localStorage';

export interface AuthToken {
  token: string;
  expiresAt: string;
}

/**
 * Get the appropriate key for storage
 * Returns 'jwt' for cookies (backend requirement), original key for localStorage
 */
function getStorageKey(key: string): string {
  if (STORAGE_STRATEGY === 'cookie' && key === TOKEN_KEY) {
    return TOKEN_KEY_COOKIE; // Use 'jwt' for cookies
  }
  return key;
}

/**
 * Get item from storage (localStorage or cookie)
 */
function getStorageItem(key: string): string | null {
  const storageKey = getStorageKey(key);
  if (STORAGE_STRATEGY === 'cookie') {
    return getCookie(storageKey);
  }
  return localStorage.getItem(key);
}

/**
 * Set item in storage (localStorage or cookie)
 */
function setStorageItem(key: string, value: string, maxAge?: number): void {
  const storageKey = getStorageKey(key);
  if (STORAGE_STRATEGY === 'cookie') {
    setCookie(storageKey, value, {
      maxAge,
      secure: window.location.protocol === 'https:',
      sameSite: 'Strict',
      path: '/',
    });
  } else {
    localStorage.setItem(key, value);
  }
}

/**
 * Remove item from storage (localStorage or cookie)
 */
function removeStorageItem(key: string): void {
  const storageKey = getStorageKey(key);
  if (STORAGE_STRATEGY === 'cookie') {
    deleteCookie(storageKey);
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * Get current storage strategy
 */
export function getStorageStrategy(): 'localStorage' | 'cookie' {
  return STORAGE_STRATEGY;
}

/**
 * Store authentication token
 */
export function setToken(token: string, expiresAt?: string): void {
  // Calculate maxAge if expiration is provided
  let maxAge: number | undefined;
  if (expiresAt) {
    const expirationTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    maxAge = Math.floor((expirationTime - currentTime) / 1000); // Convert to seconds
  }

  setStorageItem(TOKEN_KEY, token, maxAge);
  if (expiresAt) {
    setStorageItem(TOKEN_EXPIRES_KEY, expiresAt, maxAge);
  }
}

/**
 * Get authentication token
 */
export function getToken(): string | null {
  return getStorageItem(TOKEN_KEY);
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(): string | null {
  return getStorageItem(TOKEN_EXPIRES_KEY);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const expiresAt = getTokenExpiration();
  if (!expiresAt) {
    // If no expiration time is set, assume token is valid
    // The backend will handle actual token validation
    return false;
  }

  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();

  // Consider token expired if it will expire in the next 5 minutes
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return currentTime >= expirationTime - bufferTime;
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  removeStorageItem(TOKEN_KEY);
  removeStorageItem(TOKEN_EXPIRES_KEY);
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  removeToken();
  removeStorageItem(REMEMBER_ME_KEY);
  removeStorageItem(SESSION_START_KEY);
  removeStorageItem(USER_EMAIL_KEY);
}

/**
 * Set remember me preference
 */
export function setRememberMe(remember: boolean): void {
  const maxAge = remember ? 30 * 24 * 60 * 60 : undefined; // 30 days if remember me
  setStorageItem(REMEMBER_ME_KEY, remember ? 'true' : 'false', maxAge);
}

/**
 * Get remember me preference
 */
export function getRememberMe(): boolean {
  return getStorageItem(REMEMBER_ME_KEY) === 'true';
}

/**
 * Set session start time
 */
export function setSessionStart(): void {
  const maxAge = 24 * 60 * 60; // 24 hours for session tracking
  setStorageItem(SESSION_START_KEY, new Date().toISOString(), maxAge);
}

/**
 * Get session start time
 */
export function getSessionStart(): Date | null {
  const startTime = getStorageItem(SESSION_START_KEY);
  return startTime ? new Date(startTime) : null;
}

/**
 * Get session duration in milliseconds
 */
export function getSessionDuration(): number {
  const startTime = getSessionStart();
  if (!startTime) {
    return 0;
  }
  return Date.now() - startTime.getTime();
}

/**
 * Check if token needs refresh (within 10 minutes of expiration)
 */
export function shouldRefreshToken(): boolean {
  const expiresAt = getTokenExpiration();
  if (!expiresAt) {
    return false;
  }

  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  const refreshBuffer = 10 * 60 * 1000; // 10 minutes

  return (
    currentTime >= expirationTime - refreshBuffer &&
    currentTime < expirationTime
  );
}

/**
 * Get time until token expiration in milliseconds
 */
export function getTimeUntilExpiration(): number {
  const expiresAt = getTokenExpiration();
  if (!expiresAt) {
    return 0;
  }

  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  return Math.max(0, expirationTime - currentTime);
}

/**
 * Check if session is about to timeout (within 5 minutes)
 */
export function isSessionNearTimeout(
  maxSessionDuration: number = 30 * 60 * 1000,
): boolean {
  const duration = getSessionDuration();
  const warningBuffer = 5 * 60 * 1000; // 5 minutes
  return (
    duration >= maxSessionDuration - warningBuffer &&
    duration < maxSessionDuration
  );
}

/**
 * Check if session has timed out
 */
export function hasSessionTimedOut(
  maxSessionDuration: number = 30 * 60 * 1000,
): boolean {
  const duration = getSessionDuration();
  return duration >= maxSessionDuration;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) {
    return false;
  }

  return !isTokenExpired();
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
}

/**
 * Store user email
 */
export function setUserEmail(email: string): void {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  setStorageItem(USER_EMAIL_KEY, email, maxAge);
}

/**
 * Get user email
 */
export function getUserEmail(): string | null {
  return getStorageItem(USER_EMAIL_KEY);
}
