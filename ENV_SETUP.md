# Environment Variables Setup

This guide explains how to configure environment variables for the Mateflow Platform Admin application.

## Overview

The application uses environment variables to configure runtime settings like API base URLs and API keys. These values are read from `.env` files and can be overridden for different environments (development, production, etc.).

## Creating Environment Files

### 1. Create `.env` file (Development)

Create a `.env` file in the project root:

```bash
# API Configuration
UMI_APP_API_BASE_URL=http://localhost:8080

# Captcha Configuration (Cloudflare Turnstile)
# Get your key from: https://dash.cloudflare.com/?to=/:account/turnstile
# For development, you can use 'mock' which will use a mock implementation
UMI_APP_TURNSTILE_SITE_KEY=mock
UMI_APP_CAPTCHA_SITE_KEY=mock
```

### 2. Create `.env.production` file (Production)

Create a `.env.production` file for production builds:

```bash
# API Configuration
UMI_APP_API_BASE_URL=https://api.yourdomain.com

# Captcha Configuration (Cloudflare Turnstile)
UMI_APP_TURNSTILE_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb
UMI_APP_CAPTCHA_SITE_KEY=0x4AAAAAAABbBbBbBbBbBbBb
```

### 3. Add to `.gitignore`

Make sure `.env` files are in your `.gitignore` to avoid committing sensitive information:

```gitignore
# Environment files
.env
.env.local
.env.*.local
```

## Available Environment Variables

### API Configuration

- **`UMI_APP_API_BASE_URL`** (Required)
  - Description: The base URL for all API requests
  - Default: `http://localhost:8080`
  - Examples:
    - Development: `http://localhost:8080`
    - Production: `https://api.yourdomain.com`

### Captcha Configuration

- **`UMI_APP_TURNSTILE_SITE_KEY`** (Required for production)

  - Description: Cloudflare Turnstile site key for CAPTCHA verification
  - Default: `mock` (for development only)
  - Get your key from: https://dash.cloudflare.com/?to=/:account/turnstile

- **`UMI_APP_CAPTCHA_SITE_KEY`** (Fallback)
  - Description: Alternative name for the Turnstile site key
  - Falls back to this if `UMI_APP_TURNSTILE_SITE_KEY` is not set

## Important Notes

### Umi Environment Variable Naming

In Umi 4, environment variables that need to be accessible in the browser **must** be prefixed with `UMI_APP_`. This is a security feature to prevent accidentally exposing server-side secrets.

### Environment Variable Priority

Umi loads environment variables in this order (later files override earlier ones):

1. `.env` - Default values for all environments
2. `.env.local` - Local overrides (not committed to git)
3. `.env.[mode]` - Environment-specific values (e.g., `.env.production`)
4. `.env.[mode].local` - Local environment-specific overrides

### How It Works

1. **Build Time**: Environment variables are read from `.env` files and injected into the code during the build process
2. **Runtime**: The `src/config/api.ts` file reads these values and configures the OpenAPI client
3. **Initialization**: The configuration is automatically initialized in `src/app.tsx` on app load

## API Configuration Implementation

The API configuration is handled by `src/config/api.ts`:

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

This configuration is automatically initialized in `src/app.tsx` before any API calls are made.

## Why This Approach?

### Problem

The `openapi-typescript-codegen` tool generates `src/services/core/OpenAPI.ts` with hardcoded values. Every time you run `pnpm run openapi`, this file gets regenerated and overwrites any manual changes.

### Solution

Instead of modifying the generated file, we:

1. Keep the generated `OpenAPI.ts` as-is (never modify it)
2. Create a separate `src/config/api.ts` that reads from environment variables
3. Initialize the configuration at app startup
4. The generated code remains untouched and can be regenerated safely

### Benefits

- ✅ Generated code stays pristine and can be regenerated anytime
- ✅ Configuration is centralized in one place
- ✅ Easy to manage different environments (dev, staging, production)
- ✅ Supports dynamic configuration at runtime if needed
- ✅ No need for post-processing scripts
- ✅ Type-safe and well-documented

## Usage Examples

### Basic Usage

The API configuration is automatically initialized, so you can just use the services:

```typescript
import { AccountServiceService } from '@/services';

// The BASE URL is already configured from environment variables
const response = await AccountServiceService.accountServiceSignInByEmail({
  email: 'user@example.com',
  password: 'password123',
});
```

### Dynamic Configuration (if needed)

If you need to change the API base URL at runtime:

```typescript
import { setApiBaseUrl, getApiBaseUrl } from '@/config/api';

// Change the API URL dynamically
setApiBaseUrl('https://new-api-url.com');

// Get the current API URL
const currentUrl = getApiBaseUrl();
console.log('Current API URL:', currentUrl);
```

## Testing

To test different API URLs:

1. **Development**: Set `UMI_APP_API_BASE_URL=http://localhost:8080` in `.env`
2. **Staging**: Set `UMI_APP_API_BASE_URL=https://staging-api.yourdomain.com` in `.env.staging`
3. **Production**: Set `UMI_APP_API_BASE_URL=https://api.yourdomain.com` in `.env.production`

Run with different environments:

```bash
# Development
pnpm dev

# Production build
pnpm build
```

## Troubleshooting

### API calls are going to the wrong URL

1. Check your `.env` file has the correct `UMI_APP_API_BASE_URL`
2. Restart the dev server after changing `.env` files
3. Check the console for the initialization log: `[API Config] Base URL set to: ...`

### Environment variables not working

1. Make sure the variable is prefixed with `UMI_APP_`
2. Restart the dev server (environment variables are loaded at startup)
3. Check that the variable is defined in `.umirc.ts` under the `define` property

### Generated code reset my changes

This is expected behavior. Never modify `src/services/core/OpenAPI.ts` directly. Always use `src/config/api.ts` for configuration.

## See Also

- [OpenAPI Setup Guide](./docs/OPENAPI_SETUP.md)
- [Umi Environment Variables Documentation](https://umijs.org/docs/api/config#define)
