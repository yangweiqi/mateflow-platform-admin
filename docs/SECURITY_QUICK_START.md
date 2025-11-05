# Security Features Quick Start Guide

Get started with the security features in 5 minutes!

## ⚡ Quick Setup

### 1. Install Dependencies (Already Done)

All security features are self-contained with no external dependencies required.

### 2. Configure CAPTCHA (Production Only)

For development, CAPTCHA uses a mock provider. For production:

1. **Get reCAPTCHA v3 Site Key**:

   - Go to https://www.google.com/recaptcha/admin
   - Register your domain
   - Select reCAPTCHA v3
   - Copy your site key

2. **Set Environment Variable**:

   ```bash
   # .env
   RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Backend Secret Key**:
   - Also copy your secret key from reCAPTCHA admin
   - Store it in your backend environment
   - Use it to verify CAPTCHA tokens

### 3. Test It Out

The security features are automatically active! Try:

**Test Rate Limiting**:

1. Go to login page
2. Enter wrong password 3 times → See warning
3. Enter wrong password 5 times → Account locked
4. Wait 15 minutes OR clear localStorage → Try again

**Test Password Strength**:

1. Go to login page
2. Type password → See strength indicator
3. Try: `password` (weak) vs `MyP@ssw0rd123` (strong)

**Test Device Fingerprint**:

1. Login from Chrome
2. Copy localStorage
3. Open Incognito/Firefox
4. Paste localStorage
5. Refresh → Session validation may fail (different device)

---

## 🎯 Key Features at a Glance

| Feature | Status | What It Does |
| --- | --- | --- |
| ✅ Rate Limiting | Active | Locks account after 5 failed attempts for 15 min |
| ✅ CAPTCHA | Active (mock in dev) | Prevents bot attacks with reCAPTCHA v3 |
| ✅ Password Strength | Active | Shows real-time password strength |
| ✅ Device Fingerprint | Active | Detects suspicious device changes |
| ✅ CSRF Protection | Active | Prevents cross-site request forgery |
| ✅ Session Security | Active | Validates sessions, tracks activity |
| ✅ Audit Logging | Active | Logs all security events |

---

## 🔒 What Users Will See

### Normal Login Experience

1. User enters email and password
2. Clicks "Sign In"
3. Logs in immediately (CAPTCHA is invisible)
4. No friction for legitimate users

### Failed Login Experience

1. Wrong password entered
2. After 3 attempts: ⚠️ "Warning: 2 attempts remaining"
3. After 5 attempts: 🛑 "Account locked. Try again in 15 minutes"
4. Login form disabled with countdown

### Strong Password Feedback

- Type password → See colored strength bar
- Red = Very Weak
- Orange = Weak/Fair
- Green = Strong/Very Strong
- Helpful tips: "Add uppercase letters", "Include special chars"

---

## 🛠️ Customization

### Change Rate Limiting Settings

Edit `src/utils/rateLimiter.ts`:

```typescript
const MAX_ATTEMPTS = 5; // Change to 3 for stricter
const LOCKOUT_DURATION = 15 * 60 * 1000; // Change to 30 min
const ATTEMPT_WINDOW = 5 * 60 * 1000; // Time window for attempts
```

### Disable Device Fingerprinting

Edit `src/app.tsx`:

```typescript
SessionSecurityManager.configure({
  validateDeviceFingerprint: false, // Set to false
  // ... other options
});
```

### Change Password Requirements

Edit `src/pages/Login/index.tsx`:

```typescript
rules={[
  { required: true, message: 'Please input your password!' },
  { min: 12, message: 'Password must be at least 12 characters!' },  // Changed from 8
]}
```

---

## 🧪 Testing Checklist

- [ ] Login with correct credentials → Success
- [ ] Login with wrong password 3x → Warning shown
- [ ] Login with wrong password 5x → Account locked
- [ ] Wait 15 minutes → Can login again
- [ ] Password strength indicator works
- [ ] CAPTCHA token generated (check Network tab)
- [ ] CSRF token in request headers
- [ ] Device fingerprint generated (check localStorage)
- [ ] Security events logged (check console in dev mode)

---

## 📋 Backend Integration TODO

Your backend needs to handle:

### 1. Verify CAPTCHA Token

```javascript
// Example: Node.js
const response = await axios.post(
  'https://www.google.com/recaptcha/api/siteverify',
  null,
  {
    params: {
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captchaToken, // From request body
    },
  },
);

if (!response.data.success || response.data.score < 0.5) {
  return res
    .status(400)
    .json({ code: 400, msg: 'CAPTCHA verification failed' });
}
```

### 2. Validate CSRF Token

```javascript
if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
  const clientToken = req.headers['x-csrf-token'];
  const sessionToken = req.session.csrfToken;

  if (clientToken !== sessionToken) {
    return res.status(403).json({ code: 403, msg: 'Invalid CSRF token' });
  }
}
```

### 3. Store Device Fingerprints

```sql
-- Add column to users table
ALTER TABLE users ADD COLUMN known_devices JSONB DEFAULT '[]';

-- Store fingerprint on successful login
UPDATE users
SET known_devices = known_devices || '["device_fingerprint_here"]'
WHERE email = 'user@example.com';
```

### 4. Implement Rate Limiting

```python
# Example: Python/Flask
from flask_limiter import Limiter

limiter = Limiter(app)

@app.route('/sign_in', methods=['POST'])
@limiter.limit("5 per 15 minutes", key_func=lambda: request.json['email'])
def sign_in():
    # Your login logic
    pass
```

### 5. Handle Security Audit Logs

```javascript
// Optional: Store audit logs in database
app.post('/platform_admin_api/v1/security/audit', async (req, res) => {
  const log = req.body;
  await db.securityLogs.insert({
    type: log.type,
    email: log.email,
    timestamp: log.timestamp,
    metadata: log.metadata,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
  });
  res.json({ success: true });
});
```

---

## 🚀 Production Checklist

Before going to production:

- [ ] Set real reCAPTCHA site key in environment variable
- [ ] Backend verifies CAPTCHA tokens
- [ ] Backend validates CSRF tokens
- [ ] Backend implements rate limiting
- [ ] HTTPS enabled (required for secure cookies)
- [ ] Security audit logs sent to backend
- [ ] Device fingerprints stored and validated
- [ ] Monitor security logs for suspicious activity
- [ ] Set up alerts for multiple failed logins
- [ ] Test all features in production environment

---

## 📚 Need More Details?

See [SECURITY_FEATURES.md](./SECURITY_FEATURES.md) for:

- Complete API documentation
- Advanced configuration options
- Troubleshooting guide
- Performance optimization
- Compliance information

---

## 🆘 Common Issues

**Issue**: "CAPTCHA not initialized"

- **Fix**: Make sure `initCaptcha()` is called in `src/app.tsx`

**Issue**: Account locked but shouldn't be

- **Fix**: Clear localStorage or wait 15 minutes

**Issue**: CSRF errors on API calls

- **Fix**: Check backend is reading `X-CSRF-Token` header

**Issue**: Session validation fails repeatedly

- **Fix**: Disable device fingerprinting or check for browser extensions

---

**Ready to use!** 🎉 All features are active and working out of the box.

For production, just add your reCAPTCHA key and backend validation.
