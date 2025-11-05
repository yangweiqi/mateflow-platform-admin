/**
 * Security Audit Logger
 * Tracks security-related events for monitoring and compliance
 */

export type SecurityEventType =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'login_locked'
  | 'logout'
  | 'token_refresh'
  | 'session_timeout'
  | 'suspicious_activity'
  | 'password_change'
  | 'device_mismatch';

export interface SecurityEvent {
  type: SecurityEventType;
  email?: string;
  timestamp: string;
  metadata: Record<string, any>;
  userAgent?: string;
  ipAddress?: string; // Would be set by backend
}

export class SecurityAuditLogger {
  private static AUDIT_LOG_KEY = 'security_audit_log';
  private static MAX_LOG_ENTRIES = 100;
  private static BACKEND_ENDPOINT = '/platform_admin_api/v1/security/audit';

  /**
   * Log a security event
   */
  static log(event: Omit<SecurityEvent, 'timestamp' | 'userAgent'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Store locally
    this.storeLocally(fullEvent);

    // Send to backend (async, non-blocking)
    this.sendToBackend(fullEvent).catch((error) => {
      console.error('Failed to send audit log to backend:', error);
    });
  }

  /**
   * Log login attempt
   */
  static logLoginAttempt(
    email: string,
    metadata: Record<string, any> = {},
  ): void {
    this.log({
      type: 'login_attempt',
      email,
      metadata,
    });
  }

  /**
   * Log successful login
   */
  static logLoginSuccess(
    email: string,
    metadata: Record<string, any> = {},
  ): void {
    this.log({
      type: 'login_success',
      email,
      metadata,
    });
  }

  /**
   * Log failed login
   */
  static logLoginFailure(
    email: string,
    reason: string,
    metadata: Record<string, any> = {},
  ): void {
    this.log({
      type: 'login_failure',
      email,
      metadata: { reason, ...metadata },
    });
  }

  /**
   * Log account lockout
   */
  static logAccountLocked(
    email: string,
    metadata: Record<string, any> = {},
  ): void {
    this.log({
      type: 'login_locked',
      email,
      metadata,
    });
  }

  /**
   * Log logout
   */
  static logLogout(email?: string, metadata: Record<string, any> = {}): void {
    this.log({
      type: 'logout',
      email,
      metadata,
    });
  }

  /**
   * Log suspicious activity
   */
  static logSuspiciousActivity(
    description: string,
    metadata: Record<string, any> = {},
  ): void {
    this.log({
      type: 'suspicious_activity',
      metadata: { description, ...metadata },
    });
  }

  /**
   * Get all stored logs
   */
  static getLogs(filterType?: SecurityEventType): SecurityEvent[] {
    const logs = this.getAllLogs();

    if (filterType) {
      return logs.filter((log) => log.type === filterType);
    }

    return logs;
  }

  /**
   * Get logs for a specific email
   */
  static getLogsByEmail(email: string): SecurityEvent[] {
    return this.getAllLogs().filter((log) => log.email === email);
  }

  /**
   * Get recent logs (last N entries)
   */
  static getRecentLogs(count: number = 10): SecurityEvent[] {
    return this.getAllLogs().slice(0, count);
  }

  /**
   * Clear all logs (for testing/admin purposes)
   */
  static clearLogs(): void {
    try {
      localStorage.removeItem(this.AUDIT_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear audit logs:', error);
    }
  }

  /**
   * Export logs as JSON
   */
  static exportLogs(): string {
    return JSON.stringify(this.getAllLogs(), null, 2);
  }

  /**
   * Store log locally
   */
  private static storeLocally(event: SecurityEvent): void {
    try {
      const logs = this.getAllLogs();
      logs.unshift(event);

      // Keep only recent entries to avoid storage bloat
      const trimmed = logs.slice(0, this.MAX_LOG_ENTRIES);

      localStorage.setItem(this.AUDIT_LOG_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to store audit log:', error);
    }
  }

  /**
   * Send log to backend
   */
  private static async sendToBackend(event: SecurityEvent): Promise<void> {
    try {
      // Only send in production or if explicitly enabled
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Security Audit]', event);
        return;
      }

      const response = await fetch(this.BACKEND_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Fail silently to not disrupt user experience
      console.error('Backend audit logging failed:', error);
    }
  }

  /**
   * Get all stored logs
   */
  private static getAllLogs(): SecurityEvent[] {
    try {
      const stored = localStorage.getItem(this.AUDIT_LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
