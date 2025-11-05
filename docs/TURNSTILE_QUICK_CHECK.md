# 🔒 Turnstile Quick Check

## Is Turnstile Working? (30 seconds check)

### ✅ Visual Check (Development Mode)

Look for this blue banner on the login page:

```
ℹ️ 🔒 Security Active
   Cloudflare Turnstile protection enabled (interaction-only mode)
```

**See the banner?** → Turnstile is working! ✅  
**Don't see it?** → Check console (F12) for messages

---

### 🖥️ Console Check

Press **F12** → **Console** tab

**On page load**, you should see:

```
✅ Turnstile CAPTCHA loaded successfully
```

**When clicking "Sign In"**, you should see:

```
🔒 Generating Turnstile token...
✅ Turnstile token generated: 0.abcdefghijklmnop...
```

---

### 🌐 Network Check

Press **F12** → **Network** tab → Click **"Sign In"**

Look for your login request (e.g., `sign_in_by_email`)

Click it → **Payload** tab

You should see:

```json
{
  "email": "...",
  "password": "...",
  "captcha_token": "0.AAABBBCCC...",  ← Long token here!
  ...
}
```

---

## ⚠️ Common Scenarios

### Scenario 1: Using Mock Mode (No Keys Set)

**Console shows**:

```
⚠️ CAPTCHA not initialized (using mock mode)
⚠️ CAPTCHA not initialized, proceeding without token
```

**What this means**:

- No real Turnstile keys configured
- Mock provider active (for development)
- Mock token generated: `mock_captcha_token_login_...`

**To fix**: Add real keys (see below)

---

### Scenario 2: Real Turnstile Active

**Console shows**:

```
✅ Turnstile CAPTCHA loaded successfully
🔒 Generating Turnstile token...
✅ Turnstile token generated: 0.abc...
```

**What this means**:

- Real Turnstile configured and working ✅
- Script loaded from Cloudflare
- Real tokens being generated

---

### Scenario 3: Error Loading

**Console shows**:

```
❌ Turnstile CAPTCHA load failed: [error]
```

**Common causes**:

- Invalid site key
- Domain not whitelisted
- Network/firewall blocking Cloudflare
- Ad blocker interfering

**Fix**: See [Troubleshooting Guide](docs/TURNSTILE_TROUBLESHOOTING.md)

---

## 🚀 Quick Setup (2 minutes)

### Step 1: Get Keys

1. Go to: https://dash.cloudflare.com/?to=/:account/turnstile
2. Click "Add Site"
3. Domain: `localhost` (for dev) or your domain
4. Widget: **Invisible**
5. Copy **Site Key** (starts with `0x4...`)

### Step 2: Add to .env

```bash
# Create/edit .env file in project root
UMI_APP_TURNSTILE_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb
```

### Step 3: Restart Dev Server

```bash
# MUST restart after .env changes
npm start
```

### Step 4: Verify

- Visit http://localhost:8000/login
- Check console for: `✅ Turnstile CAPTCHA loaded successfully`
- See blue banner (in dev mode)

---

## ❓ FAQ

### Q: Why don't I see a CAPTCHA widget?

**A**: Turnstile in "invisible mode" **has no visible UI**. This is intentional!

- No checkbox to click
- No puzzles to solve
- Works silently in background
- Only shows challenge if suspicious activity detected

**Check console and network tab to verify it's working.**

---

### Q: What should I see in production?

**A**: In production:

- ❌ No blue info banner (only in dev mode)
- ❌ No visible widget (invisible mode)
- ✅ Check browser console for logs
- ✅ Check network tab for token

Users should see **nothing** - that's the point! 🎉

---

### Q: How do I know if my backend is getting the token?

**A**: Check your backend logs:

```javascript
// Backend
console.log('Received captcha_token:', req.body.captcha_token);
// Should show a long string starting with "0."
```

Or use Network tab:

1. F12 → Network
2. Click "Sign In"
3. Find login request
4. Check Request Payload
5. Look for `captcha_token` field

---

### Q: Mock vs Real - What's the difference?

| Feature | Mock Mode | Real Turnstile |
| --- | --- | --- |
| **Keys Required** | ❌ No | ✅ Yes |
| **Script Load** | ❌ No | ✅ Yes (`challenges.cloudflare.com`) |
| **Token Format** | `mock_captcha_token_login_...` | `0.AAABBBCCC...` |
| **Token Validation** | ⚠️ Backend should skip | ✅ Backend verifies with Cloudflare |
| **Use Case** | 🛠️ Development | 🚀 Production |

---

## 📋 Checklist

Before asking for help, verify:

- [ ] Added `UMI_APP_TURNSTILE_SITE_KEY` to `.env`
- [ ] Restarted dev server after adding `.env`
- [ ] Opened browser console (F12)
- [ ] Checked for "✅ Turnstile CAPTCHA loaded successfully"
- [ ] Clicked "Sign In" and checked for token generation message
- [ ] Checked Network tab for `captcha_token` in request
- [ ] Site key starts with `0x4...`
- [ ] Domain whitelisted in Cloudflare dashboard

---

## 🔗 More Help

- **Detailed Troubleshooting**: [docs/TURNSTILE_TROUBLESHOOTING.md](docs/TURNSTILE_TROUBLESHOOTING.md)
- **Complete Guide**: [docs/CLOUDFLARE_TURNSTILE_GUIDE.md](docs/CLOUDFLARE_TURNSTILE_GUIDE.md)
- **Cloudflare Docs**: https://developers.cloudflare.com/turnstile/

---

**TL;DR**:

- **Invisible mode = No visible widget = Working as designed!** ✅
- **Check console for** `✅ Turnstile CAPTCHA loaded successfully`
- **In dev mode, look for blue info banner**
- **Check Network tab for token in request**
