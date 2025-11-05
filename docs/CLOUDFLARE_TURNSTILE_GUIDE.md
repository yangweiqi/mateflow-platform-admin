# Cloudflare Turnstile Integration Guide

Complete guide for setting up and using Cloudflare Turnstile CAPTCHA in your Platform Admin system.

## 📋 Table of Contents

- [Why Cloudflare Turnstile?](#why-cloudflare-turnstile)
- [Quick Setup](#quick-setup)
- [Frontend Integration](#frontend-integration)
- [Backend Verification](#backend-verification)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Migration from reCAPTCHA](#migration-from-recaptcha)

---

## Why Cloudflare Turnstile?

### Advantages Over reCAPTCHA

| Feature | Cloudflare Turnstile | Google reCAPTCHA v3 |
| --- | --- | --- |
| **Privacy** | ✅ No personal data collection | ❌ Collects user data |
| **GDPR Compliance** | ✅ Fully compliant | ⚠️ Requires consent |
| **Performance** | ✅ Faster (< 50ms) | ⚠️ Slower (~100-200ms) |
| **Pricing** | ✅ Free (unlimited) | ⚠️ Pay after 1M requests/month |
| **Google Dependency** | ✅ No dependency | ❌ Requires Google access |
| **China/Restricted Regions** | ✅ Works everywhere | ❌ Blocked in some regions |
| **Modern UX** | ✅ Latest technology | ⚠️ Older approach |

### Key Benefits

✅ **Privacy-First**: No cookies, no data sent to third parties  
✅ **Faster**: Lower latency and faster verification  
✅ **Free**: No hidden costs or usage limits  
✅ **Reliable**: 99.99% uptime with Cloudflare's global network  
✅ **Easy**: Simple API, drop-in replacement for reCAPTCHA  
✅ **Invisible**: No user interaction needed (most of the time)

---

## Quick Setup

### Step 1: Get Your Turnstile Keys

1. **Sign up/Login to Cloudflare**:

   - Go to https://dash.cloudflare.com/
   - Create an account or sign in

2. **Navigate to Turnstile**:

   - Go to https://dash.cloudflare.com/?to=/:account/turnstile
   - Or: Dashboard → Account → Turnstile

3. **Add a New Site**:

   - Click **"Add Site"** button
   - Fill in the details:
     - **Site name**: `Platform Admin` (or your app name)
     - **Domain**: `yourdomain.com` (or `localhost` for dev)
     - **Widget Mode**: Select **"Managed"** (recommended)
     - **Appearance**: Select **"Interaction Only"** for minimal UI
   - Click **"Create"**

4. **Copy Your Keys**:
   - **Site Key** (public): Starts with `0x4...` - Use in frontend
   - **Secret Key**: Keep secure - Use in backend only

### Step 2: Configure Frontend

Add environment variable to your `.env` file:

```bash
# .env
TURNSTILE_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb

# Alternative variable name (both work)
CAPTCHA_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb
```

**That's it!** The frontend is already configured to use Turnstile.

### Step 3: Configure Backend

Add secret key to your backend environment:

```bash
# Backend .env
TURNSTILE_SECRET_KEY=0x4BBBBBBBBcCcCcCcCcCcCc
```

---

## Frontend Integration

The frontend integration is **already complete**! Here's how it works:

### How It Works

```typescript
// 1. App initialization (src/app.tsx)
const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY || 'mock';
initCaptcha(TURNSTILE_SITE_KEY);

// 2. On login (src/pages/Login/index.tsx)
const captcha = getCaptchaProvider();
const token = await captcha.execute('login');

// 3. Send token to backend
await signIn({
  email,
  password,
  captcha_token: token, // ← Turnstile token
  // ... other fields
});
```

### API Reference

```typescript
import { getCaptchaProvider, isCaptchaInitialized } from '@/utils/captcha';

// Check if CAPTCHA is initialized
if (isCaptchaInitialized()) {
  // Get provider instance
  const captcha = getCaptchaProvider();

  // Generate token
  const token = await captcha.execute('login');

  // Reset widget (optional)
  captcha.reset();
}
```

### Configuration Options

The Turnstile provider supports these options:

```typescript
export class CloudflareTurnstileProvider {
  constructor(siteKey: string);

  // Load Turnstile script
  async load(): Promise<void>;

  // Render widget (invisible mode)
  async render(container?: HTMLElement): Promise<void>;

  // Execute challenge and get token
  async execute(action?: string): Promise<string>;

  // Check if loaded
  isLoaded(): boolean;

  // Reset widget
  reset(): void;
}
```

### Widget Modes & Appearance

**Current Configuration** (Default - Recommended):

- **Size**: `flexible` - Full width, responsive
- **Appearance**: `interaction-only` - Only shows when interaction needed
- **Theme**: `auto` - Adapts to user's system theme
- Widget appears in login form after password field
- Takes full width (100%) of the form
- Automatic verification for most users

**Available Sizes**:

- `flexible` - Responsive width (current, recommended)
- `normal` - 300x65px
- `compact` - 150x140px

**Available Appearances**:

- `always` - Widget always visible
- `execute` - Only when execute() called
- `interaction-only` - Only shows interactive challenge when needed (recommended)

---

## Backend Verification

### Node.js / Express Example

```javascript
const express = require('express');
const axios = require('axios');

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

app.post(
  '/platform_admin_api/v1/account/sign_in_by_email',
  async (req, res) => {
    const { email, password, captcha_token } = req.body;

    // Verify Turnstile token
    try {
      const turnstileResponse = await axios.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          secret: TURNSTILE_SECRET_KEY,
          response: captcha_token,
          remoteip: req.ip, // optional but recommended
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!turnstileResponse.data.success) {
        return res.status(400).json({
          code: 400,
          msg: 'CAPTCHA verification failed',
        });
      }

      // Continue with login logic...
      // Verify email and password
      // Generate JWT token
      // Return success response
    } catch (error) {
      console.error('Turnstile verification error:', error);
      return res.status(500).json({
        code: 500,
        msg: 'Internal server error',
      });
    }
  },
);
```

### Python / Flask Example

```python
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)
TURNSTILE_SECRET_KEY = os.getenv('TURNSTILE_SECRET_KEY')

@app.route('/platform_admin_api/v1/account/sign_in_by_email', methods=['POST'])
def sign_in():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    captcha_token = data.get('captcha_token')

    # Verify Turnstile token
    verify_response = requests.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        json={
            'secret': TURNSTILE_SECRET_KEY,
            'response': captcha_token,
            'remoteip': request.remote_addr  # optional
        },
        headers={'Content-Type': 'application/json'}
    )

    result = verify_response.json()

    if not result.get('success'):
        return jsonify({
            'code': 400,
            'msg': 'CAPTCHA verification failed'
        }), 400

    # Continue with login logic...
    # Verify credentials
    # Generate token
    # Return success
```

### Go Example

```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "os"
)

type TurnstileRequest struct {
    Secret   string `json:"secret"`
    Response string `json:"response"`
    RemoteIP string `json:"remoteip,omitempty"`
}

type TurnstileResponse struct {
    Success bool     `json:"success"`
    ErrorCodes []string `json:"error-codes,omitempty"`
}

func verifyTurnstile(token string, remoteIP string) (bool, error) {
    secretKey := os.Getenv("TURNSTILE_SECRET_KEY")

    reqBody := TurnstileRequest{
        Secret:   secretKey,
        Response: token,
        RemoteIP: remoteIP,
    }

    jsonData, err := json.Marshal(reqBody)
    if err != nil {
        return false, err
    }

    resp, err := http.Post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        return false, err
    }
    defer resp.Body.Close()

    var result TurnstileResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return false, err
    }

    return result.Success, nil
}

func signInHandler(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Email       string `json:"email"`
        Password    string `json:"password"`
        CaptchaToken string `json:"captcha_token"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    // Verify Turnstile
    success, err := verifyTurnstile(req.CaptchaToken, r.RemoteAddr)
    if err != nil || !success {
        http.Error(w, "CAPTCHA verification failed", http.StatusBadRequest)
        return
    }

    // Continue with login logic...
}
```

### Verification Response

Successful response:

```json
{
  "success": true,
  "challenge_ts": "2025-10-29T10:30:00.000Z",
  "hostname": "yourdomain.com"
}
```

Failed response:

```json
{
  "success": false,
  "error-codes": ["invalid-input-response"]
}
```

### Error Codes

| Error Code | Meaning | Action |
| --- | --- | --- |
| `missing-input-secret` | Secret key not provided | Check backend config |
| `invalid-input-secret` | Invalid secret key | Verify key from dashboard |
| `missing-input-response` | Token not provided | Check frontend integration |
| `invalid-input-response` | Invalid/expired token | Ask user to retry |
| `timeout-or-duplicate` | Token already used | Tokens are single-use |
| `internal-error` | Cloudflare error | Retry request |

---

## Testing

### Development Testing

In development, the system uses a mock CAPTCHA provider:

```typescript
// Mock provider is active when:
// - TURNSTILE_SITE_KEY is not set
// - TURNSTILE_SITE_KEY = 'mock'

const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY || 'mock';
initCaptcha(TURNSTILE_SITE_KEY);
```

**Mock Behavior**:

- Always returns a fake token: `mock_captcha_token_login_[timestamp]`
- No external API calls
- Instant response
- Perfect for local development

### Testing with Real Turnstile

For testing with actual Turnstile:

1. **Use Localhost Domain**:

   ```bash
   # In Cloudflare Dashboard, add domain:
   localhost
   # or
   127.0.0.1
   ```

2. **Set Test Keys**:

   ```bash
   TURNSTILE_SITE_KEY=0x4AAAAAAA... # From dashboard
   ```

3. **Test Token Generation**:

   ```javascript
   // In browser console
   const captcha = window.getCaptchaProvider?.();
   const token = await captcha?.execute('test');
   console.log('Turnstile Token:', token);
   ```

4. **Verify Backend**:
   ```bash
   curl -X POST https://challenges.cloudflare.com/turnstile/v0/siteverify \
     -H "Content-Type: application/json" \
     -d '{
       "secret": "0x4BBB...",
       "response": "TOKEN_HERE"
     }'
   ```

### Testing Checklist

- [ ] Mock mode works in development
- [ ] Real Turnstile loads in browser
- [ ] Token generated on login attempt
- [ ] Token sent to backend in request body
- [ ] Backend verifies token successfully
- [ ] Failed verification handled gracefully
- [ ] Expired tokens rejected
- [ ] Network errors handled

---

## Troubleshooting

### Frontend Issues

**Problem**: "Turnstile not loaded"

**Solutions**:

1. Check console for script load errors
2. Verify site key is correct
3. Check domain is whitelisted in dashboard
4. Ensure `TURNSTILE_SITE_KEY` is set

**Problem**: Token generation fails

**Solutions**:

1. Check browser console for errors
2. Verify internet connection
3. Test in different browser
4. Check Cloudflare status page
5. Ensure site key matches domain

**Problem**: "Failed to load Cloudflare Turnstile script"

**Solutions**:

1. Check if `challenges.cloudflare.com` is accessible
2. Check browser network tab for blocked requests
3. Disable ad blockers/privacy extensions temporarily
4. Check Content Security Policy (CSP) headers

### Backend Issues

**Problem**: "invalid-input-secret"

**Solutions**:

1. Verify `TURNSTILE_SECRET_KEY` is set correctly
2. Ensure using secret key (not site key)
3. Check for extra spaces in environment variable
4. Regenerate secret key in dashboard if needed

**Problem**: "invalid-input-response"

**Solutions**:

1. Token may be expired (valid for 5 minutes)
2. Token may have been used already (single-use)
3. Token was generated for different site key
4. Check token is passed correctly from frontend

**Problem**: "timeout-or-duplicate"

**Solutions**:

1. Ensure frontend generates new token per request
2. Don't reuse tokens across multiple requests
3. Implement retry logic with new token

### Network Issues

**Problem**: Verification request times out

**Solutions**:

1. Check Cloudflare API status
2. Verify firewall allows outbound to `challenges.cloudflare.com`
3. Increase request timeout (default 30s should be enough)
4. Implement retry with exponential backoff

**Problem**: CORS errors

**Solutions**:

1. Turnstile API calls should be server-side only
2. Never verify tokens from frontend (security risk)
3. Check backend CORS configuration

---

## Migration from reCAPTCHA

If you're migrating from Google reCAPTCHA, here's what changed:

### Changes Made

✅ **Frontend**:

- Replaced `ReCaptchaV3Provider` with `CloudflareTurnstileProvider`
- Changed script URL from Google to Cloudflare
- Updated API calls to use Turnstile methods

✅ **Environment Variables**:

- `RECAPTCHA_SITE_KEY` → `TURNSTILE_SITE_KEY` (or `CAPTCHA_SITE_KEY`)
- Both variable names are supported for backwards compatibility

✅ **Backend**:

- Verification URL changed
- Request/response format slightly different (but similar)

### Side-by-Side Comparison

#### Environment Variables

```bash
# OLD (reCAPTCHA)
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcYYYYYYYYYYYYY

# NEW (Turnstile)
TURNSTILE_SITE_KEY=0x4AAAAAAA
TURNSTILE_SECRET_KEY=0x4BBBBBBB
```

#### Frontend Code

No changes needed! The API is identical:

```typescript
// Both work the same
const captcha = getCaptchaProvider();
const token = await captcha.execute('login');
```

#### Backend Verification

```javascript
// OLD (reCAPTCHA)
const response = await axios.post(
  'https://www.google.com/recaptcha/api/siteverify',
  `secret=${RECAPTCHA_SECRET}&response=${token}`,
);

// NEW (Turnstile)
const response = await axios.post(
  'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  {
    secret: TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: req.ip, // optional
  },
  {
    headers: { 'Content-Type': 'application/json' },
  },
);
```

#### Response Format

```javascript
// reCAPTCHA response
{
  "success": true,
  "score": 0.9,  // ← reCAPTCHA has score
  "action": "login",
  "challenge_ts": "..."
}

// Turnstile response
{
  "success": true,
  // No score, just success/fail
  "challenge_ts": "...",
  "hostname": "yourdomain.com"
}
```

### Migration Steps

1. **Get Turnstile Keys** (5 min):

   - Sign up at Cloudflare
   - Create Turnstile site
   - Copy site and secret keys

2. **Update Environment Variables**:

   ```bash
   # Add to .env
   TURNSTILE_SITE_KEY=your_site_key

   # Add to backend .env
   TURNSTILE_SECRET_KEY=your_secret_key
   ```

3. **Update Backend Verification**:

   - Change verification URL
   - Update request format
   - Remove score checking (Turnstile doesn't have scores)

4. **Test**:

   - Test login flow
   - Verify token generation
   - Check backend verification
   - Monitor error logs

5. **Deploy**:
   - Deploy frontend with new keys
   - Deploy backend with verification changes
   - Monitor for issues

**Total Migration Time**: ~30 minutes

---

## Best Practices

### Security

✅ **Always verify server-side**:

```javascript
// ✅ GOOD - Backend verification
app.post('/login', async (req, res) => {
  const verified = await verifyTurnstile(req.body.captcha_token);
  if (!verified) return res.status(400).json({ error: 'Verification failed' });
  // ... continue
});

// ❌ BAD - Never trust client without verification
app.post('/login', async (req, res) => {
  // Just accepting the token without verification
  // ... dangerous!
});
```

✅ **Keep secret key secure**:

- Never commit to git
- Use environment variables
- Rotate if compromised
- Use secrets manager in production

✅ **Validate token format**:

```javascript
function isValidTurnstileToken(token) {
  // Turnstile tokens are typically long strings
  return typeof token === 'string' && token.length > 50;
}
```

### Performance

✅ **Cache Turnstile script**:

```html
<!-- Preload for faster loading -->
<link
  rel="preload"
  href="https://challenges.cloudflare.com/turnstile/v0/api.js"
  as="script"
/>
```

✅ **Load asynchronously**: Already implemented! Script loads with `async` and `defer`.

✅ **Implement timeouts**:

```javascript
const verifyWithTimeout = async (token) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5 sec

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        signal: controller.signal,
        // ... options
      },
    );
    clearTimeout(timeout);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Turnstile verification timed out');
    }
    throw error;
  }
};
```

### User Experience

✅ **Handle errors gracefully**:

```typescript
try {
  const token = await captcha.execute('login');
} catch (error) {
  console.error('CAPTCHA error:', error);
  // Still allow login attempt - don't block user
  // Just log the error for monitoring
}
```

✅ **Provide feedback**:

```typescript
// Show loading indicator during CAPTCHA
setLoading(true);
try {
  const token = await captcha.execute('login');
  await login(email, password, token);
} finally {
  setLoading(false);
}
```

✅ **Don't block legitimate users**:

- Make CAPTCHA failure non-fatal initially
- Implement progressive challenges (stricter after multiple failures)
- Always have fallback authentication method

---

## Advanced Configuration

### Custom Widget Themes

```typescript
// Modify src/utils/captcha.ts
this.widgetId = turnstile.render(container, {
  sitekey: this.siteKey,
  theme: 'auto', // 'light', 'dark', or 'auto'
  size: 'invisible',
  language: 'auto', // or specific: 'en', 'es', 'fr', etc.
});
```

### Action Tracking

```typescript
// Track different actions
await captcha.execute('login'); // Login page
await captcha.execute('register'); // Registration
await captcha.execute('api_call'); // Sensitive API
```

### Retry Logic

```typescript
async function executeWithRetry(captcha, action, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await captcha.execute(action);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## Support & Resources

### Official Documentation

- Cloudflare Turnstile Docs: https://developers.cloudflare.com/turnstile/
- API Reference: https://developers.cloudflare.com/turnstile/get-started/
- Migration Guide: https://developers.cloudflare.com/turnstile/migration/

### Dashboard

- Turnstile Dashboard: https://dash.cloudflare.com/?to=/:account/turnstile
- Analytics: View verification success rates, challenges served, etc.

### Status

- Cloudflare Status: https://www.cloudflarestatus.com/
- Check for ongoing issues

### Support

- Community Forum: https://community.cloudflare.com/
- Enterprise Support: Available for paid plans

---

## Conclusion

Cloudflare Turnstile provides a modern, privacy-focused, and performant alternative to reCAPTCHA. The integration is complete and ready to use - just add your keys!

**Next Steps**:

1. Get your Turnstile keys from Cloudflare Dashboard
2. Add site key to frontend environment
3. Implement backend verification
4. Test thoroughly
5. Deploy to production

**Questions?** Check the [main security documentation](./SECURITY_FEATURES.md) or Cloudflare's official docs.

---

**Last Updated**: October 29, 2025  
**Version**: 1.0.1 (Turnstile)  
**Author**: Platform Admin Team
