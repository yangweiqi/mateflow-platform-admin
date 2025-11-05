# reCAPTCHA v3 → Cloudflare Turnstile Migration Summary

Quick reference for the CAPTCHA provider change from Google reCAPTCHA v3 to Cloudflare Turnstile.

## ✅ What Changed

### Frontend (Already Updated)

- ✅ CAPTCHA provider switched from reCAPTCHA to Turnstile
- ✅ Script URL updated
- ✅ API integration completed
- ✅ Mock provider for development

### Environment Variables

```bash
# OLD
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXX...

# NEW (choose one)
TURNSTILE_SITE_KEY=0x4AAAAAAA...
# or
CAPTCHA_SITE_KEY=0x4AAAAAAA...
```

## 🚀 Quick Setup

### 1. Get Turnstile Keys (2 minutes)

1. Go to: https://dash.cloudflare.com/?to=/:account/turnstile
2. Click **"Add Site"**
3. Fill in:
   - Name: `Platform Admin`
   - Domain: Your domain (or `localhost` for dev)
   - Widget: **Invisible**
4. Copy both keys:
   - **Site Key** (public) → Frontend
   - **Secret Key** → Backend

### 2. Update Frontend (.env)

```bash
TURNSTILE_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb
```

### 3. Update Backend

Change verification endpoint:

**Before (reCAPTCHA)**:

```javascript
await axios.post(
  'https://www.google.com/recaptcha/api/siteverify',
  `secret=${RECAPTCHA_SECRET}&response=${token}`,
);
```

**After (Turnstile)**:

```javascript
await axios.post(
  'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  {
    secret: TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: req.ip, // optional
  },
  { headers: { 'Content-Type': 'application/json' } },
);
```

## 📊 Key Differences

| Aspect | reCAPTCHA v3 | Turnstile |
| --- | --- | --- |
| **Script URL** | `google.com/recaptcha/api.js` | `challenges.cloudflare.com/turnstile/v0/api.js` |
| **Verify URL** | `google.com/recaptcha/api/siteverify` | `challenges.cloudflare.com/turnstile/v0/siteverify` |
| **Key Prefix** | `6Lc...` | `0x4...` |
| **Score** | Returns 0.0-1.0 score | No score, just success/fail |
| **Privacy** | Collects user data | No data collection |
| **Request Format** | Form-encoded | JSON |

## 🔧 Backend Code Examples

### Node.js / Express

```javascript
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

app.post('/login', async (req, res) => {
  const { captcha_token } = req.body;

  const response = await axios.post(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      secret: TURNSTILE_SECRET_KEY,
      response: captcha_token,
      remoteip: req.ip,
    },
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (!response.data.success) {
    return res.status(400).json({ error: 'Verification failed' });
  }

  // Continue with login...
});
```

### Python / Flask

```python
import requests

TURNSTILE_SECRET_KEY = os.getenv('TURNSTILE_SECRET_KEY')

@app.route('/login', methods=['POST'])
def login():
    captcha_token = request.json.get('captcha_token')

    response = requests.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        json={
            'secret': TURNSTILE_SECRET_KEY,
            'response': captcha_token,
            'remoteip': request.remote_addr
        }
    )

    if not response.json().get('success'):
        return jsonify({'error': 'Verification failed'}), 400

    # Continue with login...
```

### Go

```go
type TurnstileVerify struct {
    Secret   string `json:"secret"`
    Response string `json:"response"`
    RemoteIP string `json:"remoteip,omitempty"`
}

func verifyTurnstile(token, ip string) bool {
    body, _ := json.Marshal(TurnstileVerify{
        Secret:   os.Getenv("TURNSTILE_SECRET_KEY"),
        Response: token,
        RemoteIP: ip,
    })

    resp, err := http.Post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        "application/json",
        bytes.NewBuffer(body),
    )
    if err != nil {
        return false
    }
    defer resp.Body.Close()

    var result struct {
        Success bool `json:"success"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    return result.Success
}
```

## ✨ Benefits of Turnstile

### Privacy

- ✅ No cookies
- ✅ No personal data collection
- ✅ GDPR compliant by default
- ✅ No consent banner needed

### Performance

- ✅ Faster script loading (< 50ms)
- ✅ Lower latency verification
- ✅ 99.99% uptime

### Cost

- ✅ Completely free
- ✅ No usage limits
- ✅ No hidden fees

### Global Access

- ✅ Works in China
- ✅ No regional restrictions
- ✅ No Google dependency

## 🧪 Testing

### Development Mode

Already works with mock provider - no changes needed!

### Testing with Real Turnstile

1. Add `localhost` to allowed domains in Cloudflare dashboard
2. Set `TURNSTILE_SITE_KEY` in .env
3. Test login flow
4. Check browser console for token generation
5. Verify backend receives and validates token

### Testing Checklist

- [ ] Frontend generates Turnstile token
- [ ] Token sent in login request
- [ ] Backend verifies token successfully
- [ ] Failed verification handled gracefully
- [ ] Mock mode works in development
- [ ] Production mode works with real keys

## 🐛 Troubleshooting

### "Turnstile not loaded"

→ Check `TURNSTILE_SITE_KEY` is set correctly

### "invalid-input-secret"

→ Verify backend secret key is correct (not site key)

### "invalid-input-response"

→ Token may be expired (5 min validity) or already used

### Verification always fails

→ Ensure domain matches what's in Cloudflare dashboard

### CORS errors

→ Verification should happen server-side only

## 📚 Full Documentation

- **Complete Guide**: [CLOUDFLARE_TURNSTILE_GUIDE.md](./CLOUDFLARE_TURNSTILE_GUIDE.md)
- **Security Features**: [SECURITY_FEATURES.md](./SECURITY_FEATURES.md)
- **Official Docs**: https://developers.cloudflare.com/turnstile/

## ⏱️ Migration Timeline

| Step                | Time        | Difficulty |
| ------------------- | ----------- | ---------- |
| Get Turnstile keys  | 2 min       | Easy       |
| Update frontend env | 1 min       | Easy       |
| Update backend code | 10 min      | Easy       |
| Test integration    | 15 min      | Easy       |
| Deploy              | 10 min      | Easy       |
| **Total**           | **~40 min** | **Easy**   |

## 🎉 Migration Complete!

The frontend is already updated and ready to use. Just:

1. Get your Turnstile keys
2. Update environment variables
3. Update backend verification
4. Test and deploy

**Questions?** Check [CLOUDFLARE_TURNSTILE_GUIDE.md](./CLOUDFLARE_TURNSTILE_GUIDE.md) for detailed instructions.

---

**Version**: 1.0.1  
**Migration Date**: October 29, 2025  
**Status**: ✅ Frontend Complete, Backend Needs Update
