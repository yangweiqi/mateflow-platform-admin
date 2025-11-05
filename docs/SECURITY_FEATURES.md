# Security Features Documentation

This document provides a comprehensive overview of the security features implemented in the Platform Admin system.

## Table of Contents

- [Overview](#overview)
- [Features Implemented](#features-implemented)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Backend Integration](#backend-integration)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Platform Admin system now includes enterprise-grade security features to protect against common attack vectors and ensure secure user authentication. These features work together to provide defense-in-depth security.

### Key Benefits

- ✅ **Brute Force Protection** - Rate limiting prevents automated attacks
- ✅ **CAPTCHA Integration** - Stops bot attacks with reCAPTCHA v3
- ✅ **Device Fingerprinting** - Detects suspicious device changes
- ✅ **CSRF Protection** - Prevents cross-site request forgery
- ✅ **Session Security** - Advanced session validation and monitoring
- ✅ **Audit Logging** - Track all security events
- ✅ **Password Strength** - Real-time password validation

---

## Features Implemented

### 1. Rate Limiting (`src/utils/rateLimiter.ts`)

**Purpose**: Prevent brute force attacks by limiting login attempts.

**Configuration**:

- Maximum attempts: 5
- Lockout duration: 15 minutes
- Attempt window: 5 minutes

**Features**:

- Tracks failed login attempts per email
- Automatic account lockout after 5 failed attempts
- Shows remaining attempts to users
- Auto-unlock after lockout period expires

**Example**:

```typescript
import { LoginRateLimiter } from '@/utils/rateLimiter';

// Check if email is locked
if (LoginRateLimiter.isLocked(email)) {
  const remainingTime = LoginRateLimiter.getRemainingLockoutTime(email);
  // Show lockout message
}

// Record failed attempt
LoginRateLimiter.recordAttempt(email);

// Clear attempts after successful login
LoginRateLimiter.clearAttempts(email);
```

---

### 2. CAPTCHA Integration (`src/utils/captcha.ts`)

**Purpose**: Prevent bot attacks using Google reCAPTCHA v3.

**Provider Support**:

- Google reCAPTCHA v3 (Invisible, score-based)
- Mock provider for development/testing

**Configuration**:

```typescript
import { initCaptcha } from '@/utils/captcha';

// Production
initCaptcha('YOUR_RECAPTCHA_SITE_KEY');

// Development (uses mock)
initCaptcha('mock');
```

**Usage**:

```typescript
import { getCaptchaProvider } from '@/utils/captcha';

const captcha = getCaptchaProvider();
const token = await captcha.execute('login');
// Send token to backend for verification
```

**Setup Instructions**:

1. Sign up for reCAPTCHA v3 at https://www.google.com/recaptcha/admin
2. Get your site key
3. Set `RECAPTCHA_SITE_KEY` environment variable
4. Backend must verify the token with Google's API

---

### 3. Password Strength Validator (`src/utils/passwordValidator.ts`)

**Purpose**: Enforce strong passwords with real-time feedback.

**Validation Criteria**:

- Length: Minimum 8 characters (12+ recommended)
- Character variety: Uppercase, lowercase, numbers, special chars
- Pattern detection: Prevents sequential, repeated, common passwords
- Entropy calculation: Estimates crack time

**Strength Levels**:

- 0: Very Weak (red)
- 1: Weak (orange-red)
- 2: Fair (orange)
- 3: Strong (green)
- 4: Very Strong (dark green)

**Example**:

```typescript
import { validatePasswordStrength } from '@/utils/passwordValidator';

const strength = validatePasswordStrength('MyP@ssw0rd123');
console.log(strength.score); // 3
console.log(strength.label); // "Strong"
console.log(strength.feedback); // ["Password is strong!"]
```

**Component**:

```tsx
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

<PasswordStrengthIndicator
  password={password}
  showFeedback={true}
  showLabel={true}
/>;
```

---

### 4. Device Fingerprinting (`src/utils/deviceFingerprint.ts`)

**Purpose**: Detect device changes that may indicate session hijacking.

**Fingerprinting Methods**:

- Canvas fingerprinting
- WebGL fingerprinting
- Audio context fingerprinting
- Browser/system properties

**Usage**:

```typescript
import {
  getDeviceFingerprint,
  validateDeviceFingerprint,
} from '@/utils/deviceFingerprint';

// Generate fingerprint
const deviceInfo = await getDeviceFingerprint();
console.log(deviceInfo.fingerprint); // Unique hash

// Validate against stored fingerprint
const isValid = await validateDeviceFingerprint();
if (!isValid) {
  // Device changed - possible security risk
}
```

**Features**:

```typescript
export interface DeviceInfo {
  fingerprint: string; // Unique device hash
  userAgent: string; // Browser user agent
  platform: string; // OS platform
  language: string; // Browser language
  timezone: string; // User timezone
  screenResolution: string; // Screen size
  colorDepth: number; // Color depth
  hardwareConcurrency: number; // CPU cores
}
```

---

### 5. CSRF Protection (`src/utils/csrf.ts`)

**Purpose**: Prevent cross-site request forgery attacks.

**How it Works**:

1. Token generated on app load
2. Stored in sessionStorage
3. Included in all non-GET requests via `X-CSRF-Token` header
4. Backend validates token matches session

**Configuration**:

- Token validity: 24 hours
- Storage: sessionStorage (cleared on tab close)
- Auto-rotation: Recommended every 12 hours

**Usage**:

```typescript
import { getCSRFToken, setCSRFToken } from '@/utils/csrf';

// Get current token
const token = getCSRFToken(); // Auto-generates if needed

// Manually rotate
const newToken = rotateCSRFToken();
```

**Backend Integration**:

```javascript
// Express.js example
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const clientToken = req.headers['x-csrf-token'];
    const sessionToken = req.session.csrfToken;

    if (!clientToken || clientToken !== sessionToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  next();
});
```

---

### 6. Session Security (`src/utils/sessionSecurity.ts`)

**Purpose**: Advanced session validation and activity tracking.

**Features**:

- Device fingerprint validation
- Session age limits (max 7 days)
- Activity tracking
- Idle timeout detection
- Automatic session cleanup

**Configuration**:

```typescript
import { SessionSecurityManager } from '@/utils/sessionSecurity';

SessionSecurityManager.configure({
  maxConcurrentSessions: 3,
  requireReauthForSensitiveOps: true,
  validateDeviceFingerprint: true,
  trackSessionActivity: true,
});
```

**Usage**:

```typescript
// Create session on login
await SessionSecurityManager.createSession();

// Validate session
const validation = await SessionSecurityManager.validateSession();
if (!validation.valid) {
  console.warn('Session invalid:', validation.reason);
  // Force logout
}

// Update activity (done automatically)
SessionSecurityManager.updateActivity();

// Check idle status
const isIdle = SessionSecurityManager.isSessionIdle(30 * 60 * 1000); // 30 min
```

**Activity Tracking**:

```typescript
import { SessionActivityTracker } from '@/utils/sessionSecurity';

// Start tracking (done automatically in app.tsx)
SessionActivityTracker.start();

// Stop tracking on logout
SessionActivityTracker.stop();
```

---

### 7. Security Audit Logger (`src/utils/securityAudit.ts`)

**Purpose**: Track and monitor security-related events.

**Event Types**:

- `login_attempt` - Any login attempt
- `login_success` - Successful login
- `login_failure` - Failed login
- `login_locked` - Account locked due to too many attempts
- `logout` - User logout
- `token_refresh` - Token refreshed
- `session_timeout` - Session timed out
- `suspicious_activity` - Suspicious behavior detected
- `device_mismatch` - Device fingerprint changed

**Usage**:

```typescript
import { SecurityAuditLogger } from '@/utils/securityAudit';

// Log specific events
SecurityAuditLogger.logLoginAttempt('user@example.com', { ip: '1.2.3.4' });
SecurityAuditLogger.logLoginSuccess('user@example.com');
SecurityAuditLogger.logLoginFailure('user@example.com', 'Invalid password');
SecurityAuditLogger.logSuspiciousActivity('Multiple devices detected');

// Get logs
const allLogs = SecurityAuditLogger.getLogs();
const loginLogs = SecurityAuditLogger.getLogs('login_failure');
const userLogs = SecurityAuditLogger.getLogsByEmail('user@example.com');

// Export logs
const json = SecurityAuditLogger.exportLogs();
```

**Log Structure**:

```typescript
interface SecurityEvent {
  type: SecurityEventType;
  email?: string;
  timestamp: string;
  metadata: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
}
```

**Backend Integration**:

- Logs sent to backend endpoint: `/platform_admin_api/v1/security/audit`
- Only in production (dev logs to console)
- Failed sends don't block user experience

---

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# reCAPTCHA v3 Site Key (get from https://www.google.com/recaptcha/admin)
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Backend API URL (if different from default)
API_BASE_URL=https://api.yourcompany.com
```

### App Configuration (`src/app.tsx`)

The security features are automatically initialized on app load:

```typescript
// Initialize CAPTCHA
const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || 'mock';
initCaptcha(RECAPTCHA_SITE_KEY);

// Initialize CSRF token
setCSRFToken();

// Configure session security
SessionSecurityManager.configure({
  maxConcurrentSessions: 3,
  requireReauthForSensitiveOps: true,
  validateDeviceFingerprint: true,
  trackSessionActivity: true,
});

// Start activity tracking
SessionActivityTracker.start();
```

---

## Usage Guide

### Login Flow with Security Features

The login page (`src/pages/Login/index.tsx`) automatically integrates all security features:

1. **Rate Limiting Check**: Checks if email is locked before submission
2. **CAPTCHA**: Generates invisible CAPTCHA token
3. **Device Fingerprint**: Generates device fingerprint
4. **CSRF Token**: Gets CSRF token
5. **Submit**: Sends all tokens to backend
6. **Success**: Clears rate limiting, creates session
7. **Failure**: Records attempt, checks for lockout

### User Experience

**Normal Login**:

- User enters credentials and clicks "Sign In"
- No visible CAPTCHA (reCAPTCHA v3 is invisible)
- Login succeeds immediately

**Failed Login**:

- Warning after 3 failed attempts: "2 attempts remaining..."
- After 5 failed attempts: Red alert "Account locked for 15 minutes"
- Login form disabled during lockout
- Timer shows remaining lockout time

**Password Strength**:

- Real-time indicator shows password strength
- Color-coded: Red (weak) → Green (strong)
- Helpful feedback: "Include uppercase letters", etc.

---

## Backend Integration

### Required Backend Endpoints

Your backend must implement these endpoints:

#### 1. Sign In

```
POST /platform_admin_api/v1/account/sign_in_by_email

Request:
{
  "email": "user@example.com",
  "password": "password123",
  "captcha_token": "03AGdBq27...",  // Optional
  "device_fingerprint": "a1b2c3...",  // Optional
  "csrf_token": "xyz123..."           // Optional
}

Response:
{
  "code": 0,
  "msg": "Success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Backend Validations

**Rate Limiting** (Backend-side):

```python
# Example in Python/Flask
from flask_limiter import Limiter

limiter = Limiter(app, key_func=get_remote_address)

@app.route('/sign_in_by_email', methods=['POST'])
@limiter.limit("5 per 15 minutes", key_func=lambda: request.json.get('email'))
def sign_in():
    # Your login logic
    pass
```

**CAPTCHA Verification**:

```javascript
// Node.js example
const axios = require('axios');

async function verifyCaptcha(token) {
  const response = await axios.post(
    'https://www.google.com/recaptcha/api/siteverify',
    null,
    {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      },
    },
  );

  // reCAPTCHA v3 returns a score (0.0 - 1.0)
  // Higher score = more likely human
  return response.data.success && response.data.score > 0.5;
}
```

**CSRF Validation**:

```javascript
// Express middleware
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const clientToken = req.headers['x-csrf-token'];
    const sessionToken = req.session.csrfToken;

    if (!clientToken || clientToken !== sessionToken) {
      return res.status(403).json({ code: 403, msg: 'Invalid CSRF token' });
    }
  }
  next();
});
```

**Device Fingerprint Storage**:

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN device_fingerprints JSONB;

-- Store fingerprint on login
UPDATE users
SET device_fingerprints = device_fingerprints || jsonb_build_array(
  jsonb_build_object(
    'fingerprint', 'a1b2c3...',
    'last_seen', NOW(),
    'user_agent', 'Mozilla/5.0...'
  )
)
WHERE email = 'user@example.com';

-- Alert on new device
SELECT COUNT(*) FROM users
WHERE email = 'user@example.com'
  AND device_fingerprints @> '[{"fingerprint": "a1b2c3..."}]';
-- If count = 0, it's a new device
```

---

## Security Best Practices

### For Developers

1. **Never disable security features in production**

   ```typescript
   // ❌ BAD
   if (process.env.NODE_ENV === 'production') {
     initCaptcha('mock'); // Don't use mock in production!
   }

   // ✅ GOOD
   const siteKey = process.env.RECAPTCHA_SITE_KEY || 'mock';
   if (!siteKey || siteKey === 'mock') {
     console.warn('Using mock CAPTCHA - NOT FOR PRODUCTION');
   }
   initCaptcha(siteKey);
   ```

2. **Use environment variables for sensitive keys**

   ```typescript
   // ✅ GOOD
   const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY;

   // ❌ BAD - Never commit keys
   const RECAPTCHA_SITE_KEY = '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXX';
   ```

3. **Implement backend validation for all security tokens**

   - Frontend validation can be bypassed
   - Always validate CAPTCHA, CSRF, device fingerprints on backend

4. **Use HTTPS in production**

   - Secure cookies require HTTPS
   - Many security features depend on secure connections

5. **Monitor security logs**
   - Set up alerts for suspicious activities
   - Review audit logs regularly

### For System Administrators

1. **Configure rate limiting at multiple levels**:

   - Application level (implemented)
   - Web server level (Nginx/Apache)
   - CDN level (Cloudflare, AWS WAF)

2. **Set up monitoring**:

   - Track failed login attempts
   - Alert on multiple lockouts
   - Monitor for unusual device fingerprints

3. **Regular security audits**:

   - Review audit logs weekly
   - Check for brute force patterns
   - Identify compromised accounts

4. **Backup and retention**:
   - Export audit logs regularly
   - Store logs for compliance (GDPR, SOC 2)
   - Implement log rotation

---

## Troubleshooting

### CAPTCHA Not Working

**Problem**: CAPTCHA token not generated

**Solutions**:

1. Check if CAPTCHA is initialized:

   ```typescript
   import { isCaptchaInitialized } from '@/utils/captcha';
   console.log('CAPTCHA initialized:', isCaptchaInitialized());
   ```

2. Check console for errors:

   - "Failed to load reCAPTCHA script" → Network issue or invalid site key
   - "reCAPTCHA not loaded" → Script didn't load before execution

3. Verify site key:

   - Go to https://www.google.com/recaptcha/admin
   - Check if domain is whitelisted
   - Ensure using reCAPTCHA v3 key (not v2)

4. Check CSP headers:
   ```
   Content-Security-Policy: script-src 'self' https://www.google.com/recaptcha/
   ```

### Rate Limiting Issues

**Problem**: Account locked but shouldn't be

**Solution**:

```typescript
import { LoginRateLimiter } from '@/utils/rateLimiter';

// Clear lockout manually
LoginRateLimiter.clearAttempts('user@example.com');

// Or clear all
LoginRateLimiter.clearAllAttempts();
```

**Problem**: Lockout not working

**Solution**:

- Check localStorage is enabled
- Check browser doesn't clear data on close
- Verify email is consistent (case-sensitive)

### Session Security Issues

**Problem**: "Session validation failed" on every load

**Solution**:

1. Device fingerprint may be unstable (browser extensions, VPN)
2. Temporarily disable device validation:
   ```typescript
   SessionSecurityManager.configure({
     validateDeviceFingerprint: false,
   });
   ```

**Problem**: Session expires too quickly

**Solution**:

- Check token expiration time from backend
- Ensure auto-refresh is working:
  ```typescript
  // In auth model
  startAutoRefresh(); // Should be called on login
  ```

### CSRF Token Issues

**Problem**: 403 errors on API calls

**Solution**:

1. Check CSRF token is included:

   ```typescript
   import { getCSRFToken } from '@/utils/csrf';
   console.log('CSRF Token:', getCSRFToken());
   ```

2. Verify backend is checking token:

   ```javascript
   console.log('Client token:', req.headers['x-csrf-token']);
   console.log('Session token:', req.session.csrfToken);
   ```

3. Ensure GET requests don't require CSRF:
   ```typescript
   // Only non-GET requests need CSRF
   if (config.method && config.method.toUpperCase() !== 'GET') {
     config.headers['X-CSRF-Token'] = csrfToken;
   }
   ```

---

## Testing

### Manual Testing Checklist

#### Rate Limiting

- [ ] Login fails after 5 wrong attempts
- [ ] Warning shown after 3 attempts
- [ ] Account locks for 15 minutes
- [ ] Can login after lockout expires
- [ ] Successful login clears attempts

#### CAPTCHA

- [ ] CAPTCHA token generated on login
- [ ] No visible CAPTCHA UI (v3 is invisible)
- [ ] Login works with valid CAPTCHA
- [ ] Backend rejects invalid CAPTCHA

#### Password Strength

- [ ] Indicator shows weak/strong correctly
- [ ] Feedback helpful and accurate
- [ ] Color changes with strength
- [ ] Doesn't block login (informational only)

#### Device Fingerprint

- [ ] Fingerprint generated consistently
- [ ] Different devices get different prints
- [ ] Session rejected on device mismatch
- [ ] User can still login from new device

#### CSRF

- [ ] Token generated on app load
- [ ] Token included in POST/PUT/DELETE
- [ ] Token NOT in GET requests
- [ ] Backend validates token

#### Session Security

- [ ] Session created on login
- [ ] Activity tracked during use
- [ ] Session expires after 7 days
- [ ] Idle timeout works (30 min)

#### Audit Logging

- [ ] Login attempts logged
- [ ] Success/failure recorded
- [ ] Logs include metadata
- [ ] Logs sent to backend (prod)

---

## Advanced Topics

### Custom CAPTCHA Provider

You can implement custom CAPTCHA providers:

```typescript
import { CaptchaProvider } from '@/utils/captcha';

export class CustomCaptchaProvider implements CaptchaProvider {
  async load(): Promise<void> {
    // Load your CAPTCHA script
  }

  async execute(action: string): Promise<string> {
    // Execute CAPTCHA and return token
    return 'custom_token';
  }

  isLoaded(): boolean {
    return true;
  }

  reset(): void {
    // Cleanup
  }
}
```

### Multi-Factor Authentication (MFA)

To add MFA, extend the login flow:

```typescript
// After successful password validation
if (user.mfaEnabled) {
  // Send OTP via email/SMS
  await sendOTP(user.email);

  // Show OTP input screen
  setShowMFAScreen(true);

  // Verify OTP
  const otpValid = await verifyOTP(user.email, otpCode);
  if (!otpValid) {
    throw new Error('Invalid OTP');
  }
}
```

### Geolocation-Based Security

Add location checking:

```typescript
import { SecurityAuditLogger } from '@/utils/securityAudit';

// Get user location (requires geolocation API)
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    SecurityAuditLogger.log({
      type: 'login_attempt',
      email,
      metadata: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    });
  });
}
```

---

## Performance Considerations

### Impact on Load Time

| Feature            | Load Impact              | Runtime Impact        |
| ------------------ | ------------------------ | --------------------- |
| Rate Limiting      | Negligible               | < 1ms                 |
| CAPTCHA            | ~100-200ms (script load) | ~50-100ms (token gen) |
| Password Strength  | None                     | ~1-5ms                |
| Device Fingerprint | ~50-100ms (first gen)    | Cached after          |
| CSRF               | Negligible               | < 1ms                 |
| Session Security   | ~10-20ms                 | ~1-5ms                |
| Audit Logging      | Negligible               | Async, non-blocking   |

**Total Impact**: ~200-400ms on first load, negligible thereafter

### Optimization Tips

1. **Lazy load CAPTCHA**:

   ```typescript
   // Only load when needed
   if (failedAttempts > 2) {
     await getCaptchaProvider().load();
   }
   ```

2. **Cache device fingerprint**:

   ```typescript
   // Already implemented - fingerprint cached in localStorage
   const cached = getStoredDeviceFingerprint();
   if (cached) return cached;
   ```

3. **Batch audit logs**:
   ```typescript
   // Send logs in batches instead of one-by-one
   const logs = SecurityAuditLogger.getLogs();
   await sendBatch(logs);
   ```

---

## Compliance

These security features help meet compliance requirements:

- **GDPR**: Audit logging, data protection
- **SOC 2**: Access controls, monitoring
- **PCI DSS**: Strong authentication, audit trails
- **HIPAA**: Access controls, audit logging
- **ISO 27001**: Security controls, risk management

---

## Support

For issues or questions:

1. Check this documentation
2. Review troubleshooting section
3. Check audit logs for clues
4. Contact security team

---

## Changelog

### v1.0.0 (2025-10-29)

- Initial implementation
- Rate limiting (5 attempts, 15 min lockout)
- CAPTCHA integration (reCAPTCHA v3)
- Password strength validation
- Device fingerprinting
- CSRF protection
- Session security manager
- Security audit logging

---

**Last Updated**: October 29, 2025 **Version**: 1.0.0 **Maintainer**: Platform Admin Team
