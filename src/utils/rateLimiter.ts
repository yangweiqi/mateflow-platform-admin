/**
 * Login Rate Limiter
 * Prevents brute force attacks by limiting login attempts
 */

interface LoginAttempt {
  email: string;
  timestamp: number;
  count: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

export class LoginRateLimiter {
  private static STORAGE_KEY = 'login_attempts';

  /**
   * Record a failed login attempt for an email
   */
  static recordAttempt(email: string): void {
    const attempts = this.getAttempts();
    const now = Date.now();

    const existing = attempts.find((a) => a.email === email);

    if (existing) {
      // Reset count if outside attempt window
      if (now - existing.timestamp > ATTEMPT_WINDOW) {
        existing.count = 1;
        existing.timestamp = now;
      } else {
        existing.count++;
      }
    } else {
      attempts.push({ email, timestamp: now, count: 1 });
    }

    // Clean old attempts
    const filtered = attempts.filter(
      (a) => now - a.timestamp < LOCKOUT_DURATION,
    );

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to store login attempts:', error);
    }
  }

  /**
   * Check if an email is currently locked out
   */
  static isLocked(email: string): boolean {
    const attempts = this.getAttempts();
    const now = Date.now();
    const attempt = attempts.find((a) => a.email === email);

    if (!attempt) return false;

    // Check if locked and lockout period hasn't expired
    if (attempt.count >= MAX_ATTEMPTS) {
      if (now - attempt.timestamp < LOCKOUT_DURATION) {
        return true;
      } else {
        // Lockout expired, reset
        this.clearAttempts(email);
        return false;
      }
    }

    return false;
  }

  /**
   * Get remaining lockout time in milliseconds
   */
  static getRemainingLockoutTime(email: string): number {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.email === email);

    if (!attempt || attempt.count < MAX_ATTEMPTS) return 0;

    const elapsed = Date.now() - attempt.timestamp;
    return Math.max(0, LOCKOUT_DURATION - elapsed);
  }

  /**
   * Get current attempt count for an email
   */
  static getAttemptCount(email: string): number {
    const attempts = this.getAttempts();
    const now = Date.now();
    const attempt = attempts.find((a) => a.email === email);

    if (!attempt) return 0;

    // Reset if outside attempt window
    if (now - attempt.timestamp > ATTEMPT_WINDOW) {
      return 0;
    }

    return attempt.count;
  }

  /**
   * Get remaining attempts before lockout
   */
  static getRemainingAttempts(email: string): number {
    return Math.max(0, MAX_ATTEMPTS - this.getAttemptCount(email));
  }

  /**
   * Clear attempts for an email (after successful login)
   */
  static clearAttempts(email: string): void {
    const attempts = this.getAttempts().filter((a) => a.email !== email);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(attempts));
    } catch (error) {
      console.error('Failed to clear login attempts:', error);
    }
  }

  /**
   * Clear all attempts (for testing/admin purposes)
   */
  static clearAllAttempts(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear all login attempts:', error);
    }
  }

  /**
   * Get all stored attempts
   */
  private static getAttempts(): LoginAttempt[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
