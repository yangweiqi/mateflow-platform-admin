# OpenAPI Configuration Note

## About src/services/core/OpenAPI.ts

The file `src/services/core/OpenAPI.ts` is **auto-generated** by `openapi-typescript-codegen`.

### ⚠️ DO NOT MODIFY THIS FILE DIRECTLY

Every time you run `pnpm run openapi`, this file will be regenerated and your changes will be lost.

## How to Configure the API Base URL

Instead of modifying `OpenAPI.ts`, use the configuration system:

### 1. Set Environment Variables

Create a `.env` file (copy from `env.example`):

```bash
cp env.example .env
```

Edit the `.env` file:

```bash
UMI_APP_API_BASE_URL=http://localhost:8080
```

### 2. Automatic Initialization

The API configuration is automatically initialized in `src/app.tsx` on app startup using the `src/config/api.ts` module.

### 3. Dynamic Configuration (if needed)

If you need to change the URL at runtime:

```typescript
import { setApiBaseUrl, getApiBaseUrl } from '@/config/api';

setApiBaseUrl('https://new-api-url.com');
```

## Benefits of This Approach

✅ **Regeneration-safe**: Generated code stays pristine and can be regenerated anytime  
✅ **Environment-aware**: Different URLs for dev, staging, production  
✅ **Centralized**: All configuration in one place  
✅ **Type-safe**: Full TypeScript support  
✅ **No post-processing**: No need for additional build scripts

## Documentation

- See [ENV_SETUP.md](./ENV_SETUP.md) for detailed environment variable setup
- See [docs/OPENAPI_SETUP.md](./docs/OPENAPI_SETUP.md) for OpenAPI code generation guide
- See [src/services/README.md](./src/services/README.md) for API usage examples

## File Structure

```
src/
├── config/
│   └── api.ts              ← Configure API here (not auto-generated)
├── services/
│   └── core/
│       └── OpenAPI.ts      ← AUTO-GENERATED - Don't modify!
└── app.tsx                 ← Initializes API config on startup
```
