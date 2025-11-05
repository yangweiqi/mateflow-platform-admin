/**
 * Cookie utility functions for secure token storage
 * Provides httpOnly-like cookie management on the client side
 *
 * Note: True httpOnly cookies can only be set by the server.
 * This implementation provides secure cookie storage with
 * SameSite and Secure flags for enhanced security.
 */

export interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number; // in seconds
  expires?: Date;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Set a cookie with secure options
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  const {
    path = '/',
    domain,
    maxAge,
    expires,
    secure = window.location.protocol === 'https:',
    sameSite = 'Strict',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (path) {
    cookieString += `; path=${path}`;
  }

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`;
  } else if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  if (secure) {
    cookieString += '; secure';
  }

  if (sameSite) {
    cookieString += `; samesite=${sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, options: CookieOptions = {}): void {
  const { path = '/', domain } = options;

  let cookieString = `${encodeURIComponent(name)}=; max-age=0`;

  if (path) {
    cookieString += `; path=${path}`;
  }

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
}

/**
 * Check if cookies are enabled
 */
export function areCookiesEnabled(): boolean {
  try {
    const testKey = '__cookie_test__';
    setCookie(testKey, 'test', { maxAge: 1 });
    const enabled = getCookie(testKey) === 'test';
    deleteCookie(testKey);
    return enabled;
  } catch (error) {
    return false;
  }
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};
  const cookieStrings = document.cookie.split(';');

  for (const cookieString of cookieStrings) {
    const [name, ...valueParts] = cookieString.split('=');
    if (name && valueParts.length > 0) {
      const trimmedName = name.trim();
      const value = valueParts.join('=').trim();
      cookies[decodeURIComponent(trimmedName)] = decodeURIComponent(value);
    }
  }

  return cookies;
}

/**
 * Clear all cookies for the current domain
 */
export function clearAllCookies(options: CookieOptions = {}): void {
  const cookies = getAllCookies();
  Object.keys(cookies).forEach((name) => {
    deleteCookie(name, options);
  });
}
