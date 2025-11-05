# OpenAPI Base URL Configuration - Solution Summary

## Problem

The `src/services/core/OpenAPI.ts` file has a hardcoded `BASE` URL:

```typescript
export const OpenAPI: OpenAPIConfig = {
  BASE: '', // ← This gets overwritten every time you run pnpm run openapi
  VERSION: '0.0.1',
  // ...
};
```

Every time you run `pnpm run openapi` to regenerate the API client code, this file gets overwritten and loses any manual changes.

## Solution

Instead of modifying the generated file, we've implemented a **configuration layer** that:

1. Reads the BASE URL from environment variables
2. Initializes the OpenAPI client at app startup
3. Keeps the generated code untouched

## Implementation

### 1. Configuration Module (`src/config/api.ts`)

Created a new configuration module that reads from environment variables and initializes the OpenAPI client:

```typescript
import { OpenAPI } from '@/services';

export const API_BASE_URL =
  process.env.UMI_APP_API_BASE_URL || 'http://localhost:8080';

export function initializeApiConfig() {
  OpenAPI.BASE = API_BASE_URL;
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = 'include';
}
```

### 2. App Initialization (`src/app.tsx`)

Added automatic initialization at app startup:

```typescript
import { initializeApiConfig } from './config/api';

if (typeof window !== 'undefined') {
  // Initialize API configuration (must be done before any API calls)
  initializeApiConfig();
  // ... other initialization code
}
```

### 3. Environment Variables Configuration (`.umirc.ts`)

Added environment variable support:

```typescript
export default defineConfig({
  // ...
  define: {
    'process.env.UMI_APP_API_BASE_URL':
      process.env.UMI_APP_API_BASE_URL || 'http://localhost:8080',
  },
});
```

### 4. Environment File Template (`env.example`)

Created a template for environment variables:

```bash
# API Configuration
UMI_APP_API_BASE_URL=http://localhost:8080
```

## Usage

### For Development

1. **Copy the environment template**:

   ```bash
   cp env.example .env
   ```

2. **Edit `.env` with your API URL**:

   ```bash
   UMI_APP_API_BASE_URL=http://localhost:8080
   ```

3. **Start the dev server**:

   ```bash
   pnpm dev
   ```

4. **The API URL is automatically configured!** ✅

### For Production

1. **Create `.env.production`**:

   ```bash
   UMI_APP_API_BASE_URL=https://api.yourdomain.com
   ```

2. **Build for production**:
   ```bash
   pnpm build
   ```

### Regenerating API Code

You can now safely regenerate the API code anytime:

```bash
pnpm run openapi
```

Your configuration will **not** be lost because it's in a separate file!

## Benefits

| Aspect | Old Approach | New Approach |
| --- | --- | --- |
| **Regeneration** | ❌ Loses changes | ✅ Configuration preserved |
| **Environment Management** | ❌ Manual per environment | ✅ Environment-specific files |
| **Maintainability** | ❌ Scattered configuration | ✅ Centralized in one file |
| **Type Safety** | ✅ TypeScript | ✅ TypeScript |
| **Developer Experience** | ❌ Requires manual edits after regeneration | ✅ Set once, works forever |

## File Structure

```
mateflow-platform-admin/
├── .env                          ← Your environment variables (git ignored)
├── env.example                   ← Template to copy from
├── .umirc.ts                     ← Updated with env var support
├── src/
│   ├── config/
│   │   └── api.ts               ← ✨ NEW: API configuration
│   ├── app.tsx                   ← Updated: Initializes API config
│   └── services/
│       └── core/
│           └── OpenAPI.ts        ← Auto-generated (never modify!)
├── ENV_SETUP.md                  ← Detailed environment setup guide
├── openapi-config-note.md        ← Quick reference
└── OPENAPI_BASE_URL_SOLUTION.md  ← This file
```

## Dynamic Configuration (Advanced)

If you need to change the API URL at runtime:

```typescript
import { setApiBaseUrl, getApiBaseUrl } from '@/config/api';

// Change URL dynamically
setApiBaseUrl('https://staging-api.yourdomain.com');

// Get current URL
console.log('Current API URL:', getApiBaseUrl());
```

## Verification

To verify the configuration is working:

1. Start your dev server
2. Check the browser console for: `[API Config] Base URL set to: http://localhost:8080`
3. Make an API call and check the network tab to see the correct base URL being used

## Related Documentation

- **[ENV_SETUP.md](./ENV_SETUP.md)** - Comprehensive environment variable setup guide
- **[docs/OPENAPI_SETUP.md](./docs/OPENAPI_SETUP.md)** - OpenAPI code generation guide
- **[src/services/README.md](./src/services/README.md)** - API usage examples
- **[openapi-config-note.md](./openapi-config-note.md)** - Quick reference note

## Summary

✅ **Problem Solved**: Generated code no longer needs manual editing  
✅ **Future-Proof**: Can regenerate API code anytime without losing configuration  
✅ **Environment-Aware**: Different URLs for dev, staging, production  
✅ **Developer-Friendly**: Configure once in `.env`, works everywhere  
✅ **Type-Safe**: Full TypeScript support maintained  
✅ **Automatic**: Configuration happens at app startup

---

**Last Updated**: November 2025  
**Implementation**: Complete ✅
