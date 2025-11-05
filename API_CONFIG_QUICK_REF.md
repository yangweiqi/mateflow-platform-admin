# API Configuration - Quick Reference Card

## 🚀 Quick Setup (30 seconds)

```bash
# 1. Copy environment template
cp env.example .env

# 2. Edit .env (set your API URL)
# UMI_APP_API_BASE_URL=http://localhost:8080

# 3. Start dev server
pnpm dev

# ✅ Done! API is configured automatically
```

## 📝 Environment Variables

### Required

```bash
UMI_APP_API_BASE_URL=http://localhost:8080
```

### Optional

```bash
UMI_APP_TURNSTILE_SITE_KEY=mock
UMI_APP_CAPTCHA_SITE_KEY=mock
```

## 🔄 Common Tasks

### Change API URL

Edit `.env` file:

```bash
UMI_APP_API_BASE_URL=https://api.example.com
```

Then restart: `pnpm dev`

### Production Configuration

Create `.env.production`:

```bash
UMI_APP_API_BASE_URL=https://api.production.com
```

### Regenerate API Code

```bash
pnpm run openapi
```

✅ Your configuration is preserved!

### Check Current Configuration

Open browser console and look for:

```
[API Config] Base URL set to: http://localhost:8080
```

## 🏗️ Architecture at a Glance

```
.env → .umirc.ts → src/config/api.ts → src/app.tsx → OpenAPI.BASE
```

## ⚠️ Important Rules

### ✅ DO

- Put API URL in `.env` file
- Restart dev server after changing `.env`
- Commit `env.example` to git
- Use different `.env.*` files per environment

### ❌ DON'T

- Modify `src/services/core/OpenAPI.ts` directly
- Commit `.env` files to git
- Forget to restart after changing environment variables
- Use environment variables without `UMI_APP_` prefix

## 🐛 Troubleshooting

### Wrong API URL?

1. Check `.env` file has correct `UMI_APP_API_BASE_URL`
2. Restart dev server
3. Check browser console for initialization log

### Environment variable not working?

1. Variable must start with `UMI_APP_`
2. Restart dev server after changes
3. Clear browser cache if needed

### Configuration reset after regeneration?

This shouldn't happen! If it does:

1. Verify `src/config/api.ts` exists
2. Verify `src/app.tsx` imports and calls `initializeApiConfig()`

## 📂 Key Files

| File | Purpose | Edit? |
| --- | --- | --- |
| `.env` | Your configuration | ✅ Yes |
| `env.example` | Template | ✅ Yes (to add new vars) |
| `src/config/api.ts` | Configuration logic | ⚠️ Rarely |
| `src/app.tsx` | Initialization | ⚠️ Rarely |
| `.umirc.ts` | Umi config | ⚠️ Rarely |
| `src/services/core/OpenAPI.ts` | Generated code | ❌ Never |

## 🔍 Verify Setup

### Checklist

- [ ] `.env` file exists
- [ ] `UMI_APP_API_BASE_URL` is set in `.env`
- [ ] Dev server running (`pnpm dev`)
- [ ] Browser console shows: `[API Config] Base URL set to: ...`
- [ ] API calls go to correct URL (check Network tab)

## 📚 More Help

| Need | See |
| --- | --- |
| Detailed setup | [ENV_SETUP.md](ENV_SETUP.md) |
| How it works | [OPENAPI_BASE_URL_SOLUTION.md](OPENAPI_BASE_URL_SOLUTION.md) |
| Architecture | [docs/API_CONFIG_ARCHITECTURE.md](docs/API_CONFIG_ARCHITECTURE.md) |
| OpenAPI setup | [docs/OPENAPI_SETUP.md](docs/OPENAPI_SETUP.md) |
| API usage | [src/services/README.md](src/services/README.md) |

## 💡 Tips

- **Development**: Use `http://localhost:8080`
- **Production**: Use `https://api.yourdomain.com`
- **Local Backend**: Use your local IP if accessing from mobile
- **Docker**: Use service name as hostname

## 🎯 Remember

The API configuration is **automatic**! Just set it once in `.env` and forget about it.

Your configuration **survives** API code regeneration. No manual steps needed!

---

**Updated**: November 2025  
**Status**: Production Ready ✅
