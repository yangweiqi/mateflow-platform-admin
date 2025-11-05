# Cloudflare Turnstile Troubleshooting Guide

Quick guide to verify Turnstile is working and debug common issues.

## ✅ Is Turnstile Working?

### Visual Indicators

**In Development Mode**, you'll see a blue info banner on the login page:

```
🔒 Security Active
Cloudflare Turnstile protection enabled (invisible mode)
```

If you see this, Turnstile is loaded and ready! ✅

### Browser Console Checks

Open your browser's Developer Tools (F12) and check the Console:

**When Page Loads**:

```
✅ Turnstile CAPTCHA loaded successfully
```

**When You Click "Sign In"**:

```
🔒 Generating Turnstile token...
✅ Turnstile token generated: 0.abcdefghijklmnop...
```

**If Using Mock Mode** (no keys configured):

```
⚠️ CAPTCHA not initialized (using mock mode)
```

### Network Tab Checks

1. Open Developer Tools → Network tab
2. Click "Sign In"
3. Look for:
   - **Script Load**: Request to `challenges.cloudflare.com/turnstile/v0/api.js`
   - **Token in Request**: Check login request body for `captcha_token`

## 🔍 Why Is Turnstile Invisible?

**This is intentional!** Turnstile in "invisible mode" has no visible UI - it works in the background without interrupting users.

### How Invisible Mode Works

1. **Script loads silently** when page loads
2. **Token generated** when user clicks Sign In
3. **No checkbox or puzzle** to solve (unless suspicious activity detected)
4. **Users see nothing** - seamless experience

### When Does Turnstile Show UI?

Turnstile **only shows interactive challenges** if:

- Suspicious activity detected
- Bot-like behavior
- High-risk IP address
- Multiple failed attempts

Most legitimate users **never see anything**! 🎉

## 🐛 Common Issues

### Issue 1: "⚠️ CAPTCHA not initialized (using mock mode)"

**Cause**: No Turnstile site key configured

**Solution**:

```bash
# Add to .env file (Umi.js apps use UMI_APP_ prefix)
UMI_APP_TURNSTILE_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb

# Alternative variable name
UMI_APP_CAPTCHA_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb
```

**Verify**:

```javascript
// In browser console
console.log(process.env.UMI_APP_TURNSTILE_SITE_KEY);
// Should show your key, not 'mock'
```

### Issue 2: "❌ Turnstile CAPTCHA load failed"

**Causes**:

- Invalid site key
- Domain not whitelisted in Cloudflare
- Network/firewall blocking Cloudflare
- Ad blocker or privacy extension

**Solutions**:

1. **Verify Site Key**:

   - Go to https://dash.cloudflare.com/?to=/:account/turnstile
   - Check your site key matches exactly
   - Keys start with `0x4...`

2. **Check Domain Whitelist**:

   - In Cloudflare dashboard, verify domain is added
   - For dev: Add `localhost` or `127.0.0.1`
   - Domain must match exactly (no www vs non-www mismatch)

3. **Test Connectivity**:

   ```bash
   # Test if you can reach Cloudflare
   curl https://challenges.cloudflare.com/turnstile/v0/api.js
   ```

4. **Disable Extensions**:
   - Try in Incognito/Private mode
   - Disable ad blockers temporarily
   - Check browser console for blocked requests

### Issue 3: "❌ CAPTCHA generation error"

**Causes**:

- Script not loaded yet
- Network timeout
- Cloudflare API error

**Solutions**:

1. **Check Console for Details**:

   ```javascript
   // Look for specific error message
   ❌ CAPTCHA generation error: [Error details]
   ```

2. **Wait and Retry**:

   - Script may still be loading
   - Wait 2-3 seconds and try again

3. **Check Network Tab**:
   - Look for failed requests
   - Check response status codes
   - Verify no CORS errors

### Issue 4: Script Loads But No Token Generated

**Cause**: Turnstile API not fully initialized

**Debug Steps**:

1. **Check if Turnstile Global Exists**:

   ```javascript
   // In browser console
   console.log(window.turnstile);
   // Should show an object with methods
   ```

2. **Manually Test Token Generation**:

   ```javascript
   // In browser console
   const container = document.createElement('div');
   document.body.appendChild(container);

   window.turnstile.render(container, {
     sitekey: '0x4AAAAAAA...', // Your key
     callback: (token) => console.log('Token:', token),
   });
   ```

3. **Check for JavaScript Errors**:
   - Look in console for errors
   - Check if other scripts are conflicting

### Issue 5: Backend Says "Invalid Token"

**Causes**:

- Token expired (5 min validity)
- Token already used (single-use)
- Wrong secret key on backend
- Token from different site key

**Solutions**:

1. **Verify Token Format**:

   ```javascript
   // Turnstile tokens are long strings
   console.log('Token length:', captchaToken.length);
   // Should be > 100 characters
   ```

2. **Check Backend Secret Key**:

   ```bash
   # On backend, verify:
   echo $TURNSTILE_SECRET_KEY
   # Should start with 0x4... (different from site key)
   ```

3. **Test Backend Verification**:

   ```bash
   # Manual verification test
   curl -X POST https://challenges.cloudflare.com/turnstile/v0/siteverify \
     -H "Content-Type: application/json" \
     -d '{
       "secret": "YOUR_SECRET_KEY",
       "response": "TOKEN_FROM_FRONTEND"
     }'

   # Should return:
   # {"success": true, ...}
   ```

4. **Ensure Fresh Token**:
   - Token expires after 5 minutes
   - Token is single-use (can't verify twice)
   - Generate new token for each login attempt

## 🧪 Testing Guide

### 1. Development Testing (Mock Mode)

```bash
# No keys needed
npm start

# Check console:
⚠️ CAPTCHA not initialized (using mock mode)

# Mock token will be generated:
✅ Turnstile token generated: mock_captcha_token_login_...
```

### 2. Development Testing (Real Turnstile)

```bash
# Set your key in .env
UMI_APP_TURNSTILE_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb

# In Cloudflare dashboard, add domain:
localhost

# Start app
npm start

# Check console:
✅ Turnstile CAPTCHA loaded successfully

# Check blue banner appears on login page
```

### 3. Production Testing

```bash
# Set production key
UMI_APP_TURNSTILE_SITE_KEY=0x4PROD_KEY_HERE

# Build and deploy
npm run build

# Test:
# 1. No blue banner (production mode)
# 2. Check browser console for logs
# 3. Verify network requests
# 4. Test backend receives token
```

## 📋 Complete Checklist

Use this to verify everything is working:

### Frontend Setup

- [ ] Environment variable set: `UMI_APP_TURNSTILE_SITE_KEY`
- [ ] Restart dev server after adding env var
- [ ] No console errors on page load
- [ ] Console shows: "✅ Turnstile CAPTCHA loaded successfully"
- [ ] Blue info banner visible (dev mode only)
- [ ] Network tab shows script from `challenges.cloudflare.com`

### Token Generation

- [ ] Click "Sign In" button
- [ ] Console shows: "🔒 Generating Turnstile token..."
- [ ] Console shows: "✅ Turnstile token generated: 0.abc..."
- [ ] Network tab shows login request with `captcha_token` field
- [ ] Token is a long string (100+ characters)

### Backend Integration

- [ ] Backend has `TURNSTILE_SECRET_KEY` set
- [ ] Backend verifies token with Cloudflare API
- [ ] Backend endpoint: `challenges.cloudflare.com/turnstile/v0/siteverify`
- [ ] Backend sends JSON (not form-encoded)
- [ ] Backend handles success/failure correctly

### Cloudflare Dashboard

- [ ] Site created at https://dash.cloudflare.com/?to=/:account/turnstile
- [ ] Widget mode set to "Invisible"
- [ ] Domain whitelisted (e.g., `localhost`, `yourdomain.com`)
- [ ] Site key copied correctly (starts with `0x4...`)
- [ ] Secret key copied correctly (different from site key)

## 🔧 Debug Commands

### Check Environment Variables

```javascript
// In browser console
console.log('Turnstile Key:', process.env.UMI_APP_TURNSTILE_SITE_KEY);
console.log('Captcha Key:', process.env.UMI_APP_CAPTCHA_SITE_KEY);
console.log('Node Env:', process.env.NODE_ENV);
```

### Check CAPTCHA Provider

```javascript
// In browser console
import { isCaptchaInitialized, getCaptchaProvider } from '@/utils/captcha';

console.log('Is initialized:', isCaptchaInitialized());

if (isCaptchaInitialized()) {
  const captcha = getCaptchaProvider();
  console.log('Is loaded:', captcha.isLoaded());

  // Try to generate token
  captcha
    .execute('test')
    .then((token) => {
      console.log('Test token:', token);
    })
    .catch((err) => {
      console.error('Token generation failed:', err);
    });
}
```

### Check Turnstile Global

```javascript
// In browser console
console.log('Turnstile loaded:', !!window.turnstile);
console.log('Turnstile methods:', Object.keys(window.turnstile || {}));
```

### Monitor Network Requests

```javascript
// In browser console (before clicking Sign In)
const originalFetch = window.fetch;
window.fetch = function (...args) {
  console.log('Fetch:', args[0]);
  return originalFetch.apply(this, args);
};
```

## 💡 Quick Fixes

### "Nothing happens when I click Sign In"

1. Open browser console (F12)
2. Look for JavaScript errors
3. Check if form validation is blocking
4. Verify button is not disabled

### "Blue banner never appears"

**This is normal if**:

- In production mode (`NODE_ENV !== 'development'`)
- Banner only shows in development

**Check Console Instead**:

```
✅ Turnstile CAPTCHA loaded successfully
```

### "Using mock mode but I want real Turnstile"

1. Add `.env` file to project root:

   ```bash
   UMI_APP_TURNSTILE_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb
   ```

2. **Restart dev server** (must restart after .env changes)

   ```bash
   npm start
   ```

3. Verify in console:
   ```javascript
   console.log(process.env.UMI_APP_TURNSTILE_SITE_KEY);
   // Should show your key, not 'mock'
   ```

## 📞 Still Having Issues?

### Collect Debug Info

```javascript
// Run this in browser console and share output
console.log({
  turnstileKey: process.env.UMI_APP_TURNSTILE_SITE_KEY,
  captchaInitialized: isCaptchaInitialized(),
  turnstileGlobal: !!window.turnstile,
  nodeEnv: process.env.NODE_ENV,
  userAgent: navigator.userAgent,
});
```

### Check Cloudflare Status

Visit: https://www.cloudflarestatus.com/

Ensure Turnstile service is operational.

### Review Documentation

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Our Complete Guide](./CLOUDFLARE_TURNSTILE_GUIDE.md)
- [Migration Guide](./RECAPTCHA_TO_TURNSTILE_MIGRATION.md)

---

## ✅ Expected Behavior Summary

**Development Mode WITH Keys**:

- Blue info banner: "🔒 Security Active"
- Console: "✅ Turnstile CAPTCHA loaded successfully"
- On login: "✅ Turnstile token generated"
- Real token sent to backend

**Development Mode WITHOUT Keys (Mock)**:

- Console: "⚠️ CAPTCHA not initialized (using mock mode)"
- On login: "✅ Turnstile token generated: mock_captcha_token..."
- Mock token sent to backend (backend must handle)

**Production Mode**:

- No visible UI (invisible mode)
- Check browser console for logs
- Token silently generated and sent
- Users never see CAPTCHA (unless suspicious)

---

**Remember**: Invisible mode = No visible widget = Working as designed! ✅

Check the console and network tab to verify it's working.
