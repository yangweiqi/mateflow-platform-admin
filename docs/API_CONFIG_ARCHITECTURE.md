# API Configuration Architecture

## Overview

This document explains the architecture for configuring the OpenAPI client base URL using environment variables while preserving the ability to regenerate API code safely.

## Architecture Diagram

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                     CONFIGURATION FLOW                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    ┌─────────────────────────────────────────────────┐
    │            1. ENVIRONMENT VARIABLES              │
    │                                                  │
    │  .env                 .env.production            │
    │  ├─ UMI_APP_API_    ├─ UMI_APP_API_            │
    │  │  BASE_URL=       │  BASE_URL=                │
    │  │  localhost:8080  │  api.domain.com           │
    │  └─ [dev values]    └─ [prod values]            │
    └────────────────┬────────────────────────────────┘
                     │
                     │ Loaded by Umi build system
                     ↓
    ┌─────────────────────────────────────────────────┐
    │         2. UMI CONFIGURATION (.umirc.ts)        │
    │                                                  │
    │  export default defineConfig({                  │
    │    define: {                                     │
    │      'process.env.UMI_APP_API_BASE_URL':        │
    │        process.env.UMI_APP_API_BASE_URL         │
    │    }                                             │
    │  });                                             │
    └────────────────┬────────────────────────────────┘
                     │
                     │ Injected at build time
                     ↓
    ┌─────────────────────────────────────────────────┐
    │       3. API CONFIGURATION (src/config/api.ts)  │
    │                                                  │
    │  export const API_BASE_URL =                    │
    │    process.env.UMI_APP_API_BASE_URL ||          │
    │    'http://localhost:8080';                     │
    │                                                  │
    │  export function initializeApiConfig() {        │
    │    OpenAPI.BASE = API_BASE_URL;                 │
    │    OpenAPI.WITH_CREDENTIALS = true;             │
    │    OpenAPI.CREDENTIALS = 'include';             │
    │  }                                               │
    └────────────────┬────────────────────────────────┘
                     │
                     │ Called at app startup
                     ↓
    ┌─────────────────────────────────────────────────┐
    │      4. APP INITIALIZATION (src/app.tsx)        │
    │                                                  │
    │  import { initializeApiConfig } from            │
    │    './config/api';                              │
    │                                                  │
    │  if (typeof window !== 'undefined') {           │
    │    initializeApiConfig(); // ← Initialize!      │
    │    // ... other setup                           │
    │  }                                               │
    └────────────────┬────────────────────────────────┘
                     │
                     │ Sets OpenAPI.BASE
                     ↓
    ┌─────────────────────────────────────────────────┐
    │  5. GENERATED CODE (src/services/core/OpenAPI.ts)│
    │                                                  │
    │  export const OpenAPI: OpenAPIConfig = {        │
    │    BASE: '',  // ← Gets set to API_BASE_URL     │
    │    VERSION: '0.0.1',                            │
    │    WITH_CREDENTIALS: false,                     │
    │    // ...                                        │
    │  };                                              │
    │                                                  │
    │  ⚠️  AUTO-GENERATED - DO NOT MODIFY!            │
    └────────────────┬────────────────────────────────┘
                     │
                     │ Used by all services
                     ↓
    ┌─────────────────────────────────────────────────┐
    │     6. API SERVICES (src/services/services/)    │
    │                                                  │
    │  AccountServiceService                          │
    │  SuperAdminServiceService                       │
    │  PresetThemeServiceService                      │
    │                                                  │
    │  All requests use OpenAPI.BASE                  │
    └─────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                     REGENERATION SAFETY                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    When you run: pnpm run openapi

    ┌────────────────────────────────────┐
    │  openapi-typescript-codegen        │
    │                                    │
    │  Regenerates:                      │
    │  ✓ src/services/core/OpenAPI.ts   │ ← Overwritten
    │  ✓ src/services/services/*         │ ← Overwritten
    │  ✓ src/services/models/*           │ ← Overwritten
    └────────────────────────────────────┘

    ┌────────────────────────────────────┐
    │  Your Configuration Files          │
    │                                    │
    │  PRESERVED:                        │
    │  ✓ .env                            │ ← Safe
    │  ✓ src/config/api.ts               │ ← Safe
    │  ✓ src/app.tsx                     │ ← Safe
    │  ✓ .umirc.ts                       │ ← Safe
    └────────────────────────────────────┘

    Result: Configuration intact! ✅
```

## Component Responsibilities

### 1. Environment Files (`.env`, `.env.production`)

**Purpose**: Store environment-specific configuration values

- **Responsibility**: Define `UMI_APP_API_BASE_URL` for each environment
- **Lifecycle**: Created once, updated as needed
- **Version Control**: ❌ Not committed (in `.gitignore`)

**Example**:

```bash
UMI_APP_API_BASE_URL=http://localhost:8080
```

### 2. Umi Configuration (`.umirc.ts`)

**Purpose**: Configure build system and inject environment variables

- **Responsibility**: Make `UMI_APP_API_BASE_URL` available in browser
- **Lifecycle**: Rarely modified
- **Version Control**: ✅ Committed

**Code**:

```typescript
define: {
  'process.env.UMI_APP_API_BASE_URL':
    process.env.UMI_APP_API_BASE_URL || 'http://localhost:8080',
}
```

### 3. API Configuration Module (`src/config/api.ts`)

**Purpose**: Central configuration for OpenAPI client

- **Responsibility**:
  - Read environment variable
  - Provide initialization function
  - Export configuration utilities
- **Lifecycle**: Created once, rarely modified
- **Version Control**: ✅ Committed

**Key Functions**:

- `initializeApiConfig()` - Initialize OpenAPI.BASE
- `setApiBaseUrl(url)` - Dynamic URL changes
- `getApiBaseUrl()` - Get current URL

### 4. App Initialization (`src/app.tsx`)

**Purpose**: Bootstrap application

- **Responsibility**: Call `initializeApiConfig()` at startup
- **Lifecycle**: Modified for new initialization needs
- **Version Control**: ✅ Committed

**Integration**:

```typescript
import { initializeApiConfig } from './config/api';

if (typeof window !== 'undefined') {
  initializeApiConfig();
}
```

### 5. Generated OpenAPI Config (`src/services/core/OpenAPI.ts`)

**Purpose**: OpenAPI client configuration object

- **Responsibility**: Store BASE URL and other config
- **Lifecycle**: **Regenerated by openapi-typescript-codegen**
- **Version Control**: ✅ Committed (generated code)
- **⚠️ WARNING**: Never modify manually!

**State After Initialization**:

```typescript
OpenAPI.BASE = 'http://localhost:8080'; // Set by initializeApiConfig()
```

### 6. API Service Classes (`src/services/services/`)

**Purpose**: Make API requests

- **Responsibility**: Use `OpenAPI.BASE` for all requests
- **Lifecycle**: **Regenerated by openapi-typescript-codegen**
- **Version Control**: ✅ Committed (generated code)

## Data Flow

### Build Time Flow

```
Developer creates .env file
    ↓
Umi reads .env during build
    ↓
.umirc.ts defines process.env variables
    ↓
Variables injected into compiled code
    ↓
src/config/api.ts reads injected variables
    ↓
Built application contains correct values
```

### Runtime Flow

```
Browser loads application
    ↓
src/app.tsx executes
    ↓
initializeApiConfig() is called
    ↓
OpenAPI.BASE is set to API_BASE_URL
    ↓
API services use OpenAPI.BASE for requests
    ↓
All requests go to correct base URL ✅
```

## Why This Architecture?

### Problem with Direct Modification

```
❌ BAD APPROACH:

1. Developer edits src/services/core/OpenAPI.ts
2. Sets BASE to 'http://localhost:8080'
3. Works great!
4. Backend API changes, need to regenerate
5. Run: pnpm run openapi
6. 💥 OpenAPI.ts is overwritten
7. BASE is reset to ''
8. Need to manually edit again
9. Error-prone and frustrating!
```

### Solution with Configuration Layer

```
✅ GOOD APPROACH:

1. Developer creates .env file
2. Sets UMI_APP_API_BASE_URL=http://localhost:8080
3. src/config/api.ts reads this value
4. src/app.tsx calls initializeApiConfig()
5. OpenAPI.BASE is set programmatically
6. Works great!
7. Backend API changes, need to regenerate
8. Run: pnpm run openapi
9. ✅ OpenAPI.ts is regenerated
10. ✅ src/config/api.ts is untouched
11. ✅ Configuration still works
12. No manual intervention needed!
```

## Benefits Summary

| Aspect                     | Benefit                                       |
| -------------------------- | --------------------------------------------- |
| **Separation of Concerns** | Generated code and configuration are separate |
| **Regeneration Safety**    | Configuration survives code regeneration      |
| **Environment Support**    | Different URLs for dev, staging, production   |
| **Type Safety**            | Full TypeScript support throughout            |
| **Single Source of Truth** | One place to change configuration             |
| **No Manual Steps**        | Automatic initialization                      |
| **Standard Practices**     | Uses .env files (industry standard)           |
| **Debugging**              | Console logs show initialization              |

## Security Considerations

### Environment Variables

- ✅ `.env` files are in `.gitignore`
- ✅ No sensitive data in source code
- ✅ Each environment has its own configuration

### API Configuration

- ✅ Uses CORS credentials (`WITH_CREDENTIALS: true`)
- ✅ Includes credentials in requests (`CREDENTIALS: 'include'`)
- ✅ Can be configured per environment

## Testing Strategy

### Unit Testing

Test `src/config/api.ts` functions:

```typescript
describe('API Configuration', () => {
  it('should read from environment variable', () => {
    expect(API_BASE_URL).toBeDefined();
  });

  it('should initialize OpenAPI config', () => {
    initializeApiConfig();
    expect(OpenAPI.BASE).toBe(API_BASE_URL);
  });
});
```

### Integration Testing

1. Set different `UMI_APP_API_BASE_URL` values
2. Start application
3. Verify API requests go to correct URL
4. Check console logs for initialization message

### Regeneration Testing

1. Note current configuration
2. Run `pnpm run openapi`
3. Verify configuration still works
4. Compare before/after behavior

## Troubleshooting

### Issue: API calls go to wrong URL

**Diagnosis**:

```typescript
// Check in browser console
console.log('API Base URL:', OpenAPI.BASE);
```

**Solution**:

1. Verify `.env` file exists and has correct value
2. Restart dev server (env vars loaded at startup)
3. Check browser console for initialization log

### Issue: Environment variable not working

**Diagnosis**:

- Check `.umirc.ts` has `define` section
- Check variable is prefixed with `UMI_APP_`
- Check `.env` file format

**Solution**:

1. Ensure variable name starts with `UMI_APP_`
2. Restart dev server
3. Clear browser cache

### Issue: Configuration reset after regeneration

**Diagnosis**:

- This shouldn't happen with new architecture
- If it does, check if `src/config/api.ts` was accidentally deleted

**Solution**:

1. Verify `src/config/api.ts` exists
2. Verify `src/app.tsx` calls `initializeApiConfig()`
3. Verify `.umirc.ts` has `define` section

## Migration Guide

### From Manual Configuration

**Before** (manual editing):

```typescript
// In src/services/core/OpenAPI.ts (gets overwritten)
export const OpenAPI: OpenAPIConfig = {
  BASE: 'http://localhost:8080', // ← Manually edited
  // ...
};
```

**After** (automatic configuration):

```bash
# In .env (never gets overwritten)
UMI_APP_API_BASE_URL=http://localhost:8080
```

**Migration Steps**:

1. Note your current BASE URL value
2. Create `.env` file with that value
3. Remove any manual edits to `OpenAPI.ts`
4. Run `pnpm run openapi` to regenerate
5. Restart dev server
6. Verify it works

## Future Enhancements

Possible improvements to this architecture:

1. **Multiple API Endpoints**: Support for different base URLs per service
2. **Dynamic Environments**: Switch between environments at runtime
3. **Configuration UI**: Admin interface to change API URL
4. **Health Checks**: Verify API URL is accessible before making requests
5. **Fallback URLs**: Automatic retry with fallback URLs

## Related Documentation

- [ENV_SETUP.md](../ENV_SETUP.md) - Environment setup guide
- [OPENAPI_BASE_URL_SOLUTION.md](../OPENAPI_BASE_URL_SOLUTION.md) - Solution overview
- [OPENAPI_SETUP.md](./OPENAPI_SETUP.md) - OpenAPI generation guide

## Conclusion

This architecture provides a robust, maintainable solution for configuring the OpenAPI client base URL:

- ✅ Safe from regeneration
- ✅ Environment-aware
- ✅ Type-safe
- ✅ Automatic
- ✅ Well-documented

The separation between generated code and configuration ensures that your setup remains intact no matter how many times you regenerate the API client.
