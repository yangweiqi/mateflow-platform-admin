/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Generates and validates CSRF tokens
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_TIMESTAMP_KEY = 'csrf_token_timestamp';
const TOKEN_VALIDITY_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cryptographically secure random token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

/**
 * Set CSRF token in session storage
 */
export function setCSRFToken(token?: string): string {
  const csrfToken = token || generateCSRFToken();
  try {
    sessionStorage.setItem(CSRF_TOKEN_KEY, csrfToken);
    sessionStorage.setItem(CSRF_TOKEN_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to set CSRF token:', error);
  }
  return csrfToken;
}

/**
 * Get current CSRF token
 * Generates a new one if none exists or if expired
 */
export function getCSRFToken(): string {
  try {
    const token = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const timestamp = sessionStorage.getItem(CSRF_TOKEN_TIMESTAMP_KEY);

    // Check if token exists and is not expired
    if (token && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < TOKEN_VALIDITY_DURATION) {
        return token;
      }
    }

    // Generate new token if none exists or expired
    return setCSRFToken();
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return generateCSRFToken();
  }
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  try {
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const timestamp = sessionStorage.getItem(CSRF_TOKEN_TIMESTAMP_KEY);

    if (!storedToken || !timestamp) {
      return false;
    }

    // Check token match
    if (token !== storedToken) {
      return false;
    }

    // Check expiration
    const age = Date.now() - parseInt(timestamp, 10);
    return age < TOKEN_VALIDITY_DURATION;
  } catch (error) {
    console.error('Failed to validate CSRF token:', error);
    return false;
  }
}

/**
 * Clear CSRF token
 */
export function clearCSRFToken(): void {
  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    sessionStorage.removeItem(CSRF_TOKEN_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Failed to clear CSRF token:', error);
  }
}

/**
 * Rotate CSRF token (generate new one)
 */
export function rotateCSRFToken(): string {
  clearCSRFToken();
  return setCSRFToken();
}

/**
 * Get CSRF token age in milliseconds
 */
export function getCSRFTokenAge(): number {
  try {
    const timestamp = sessionStorage.getItem(CSRF_TOKEN_TIMESTAMP_KEY);
    if (!timestamp) return -1;
    return Date.now() - parseInt(timestamp, 10);
  } catch {
    return -1;
  }
}

/**
 * Check if CSRF token needs rotation
 */
export function shouldRotateCSRFToken(
  rotationThreshold: number = 12 * 60 * 60 * 1000,
): boolean {
  const age = getCSRFTokenAge();
  return age === -1 || age > rotationThreshold;
}
