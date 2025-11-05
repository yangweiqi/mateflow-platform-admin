# OpenAPI Setup Complete ✅

## What Was Done

The OpenAPI code generation has been successfully configured for your Umi 4 / @umijs/max project using **@hey-api/openapi-ts**.

### Changes Made

1. **Installed `@hey-api/openapi-ts`** - A modern, actively maintained tool that generates TypeScript API clients from OpenAPI specifications

   - Added to `devDependencies` in `package.json`
   - Removed the deprecated `openapi-typescript-codegen` package

2. **Created configuration file** - Added `openapi-ts.config.ts` at the project root:

   ```typescript
   import { defineConfig } from '@hey-api/openapi-ts';

   export default defineConfig({
     client: '@hey-api/client-fetch',
     input: './openapi.json',
     output: {
       format: 'prettier',
       path: './src/services',
     },
     services: {
       asClass: true,
     },
   });
   ```

3. **Updated npm script** - Modified the `openapi` script in `package.json`:

   ```json
   "openapi": "openapi-ts"
   ```

4. **Generated API Services** - Created TypeScript API client code in `src/services/`:
   - `sdk.gen.ts` - Generated API functions for all endpoints
   - `types.gen.ts` - TypeScript types for all request/response bodies
   - `client.gen.ts` - Configured client instance
   - `client/` - Core client infrastructure (interceptors, serializers, etc.)
   - `core/` - Core utilities (auth, body serializers, etc.)
   - `index.ts` - Main export file

### Why @hey-api/openapi-ts?

We chose `@hey-api/openapi-ts` because:

- **Modern & Actively Maintained** - Latest OpenAPI 3.x support with regular updates
- **Better TypeScript Support** - Improved type inference and type safety
- **Flexible Architecture** - Function-based API with customizable client
- **Advanced Features** - Built-in interceptors, better error handling, SSE support
- **Framework Agnostic** - Works with any JavaScript/TypeScript framework

## How to Use

### 1. Regenerate API Code

Whenever you update `openapi.json`, run:

```bash
pnpm run openapi
```

### 2. Configure the API Base URL

**IMPORTANT**: The API base URL is now automatically configured from environment variables!

#### Using Environment Variables (Recommended)

Create a `.env` file in the project root:

```bash
# API Configuration
UMI_APP_API_BASE_URL=http://localhost:8080
```

For production, create a `.env.production` file:

```bash
# API Configuration
UMI_APP_API_BASE_URL=https://api.yourdomain.com
```

The configuration is automatically initialized in `src/app.tsx` using the `src/config/api.ts` module.

**Why this approach?**

- The generated `src/services/core/OpenAPI.ts` file gets overwritten every time you run `pnpm run openapi`
- By using a separate configuration file, your settings are preserved
- Environment-specific values can be easily managed

For more details, see [ENV_SETUP.md](../ENV_SETUP.md)

### 3. Use the Generated Services

```typescript
import { accountServiceSignInByEmail } from '@/services';

// Example: Sign in
const response = await accountServiceSignInByEmail({
  body: {
    email: 'admin@example.com',
    password: 'password123',
  },
});

// Access the response data
if (response.data?.code === 0) {
  console.log('Login successful:', response.data.data);
}
```

## Documentation

See `src/services/README.md` for detailed usage examples and API documentation.

## Available APIs

Your OpenAPI spec includes 3 service groups:

- **AccountService** - 3 endpoints (refresh token, sign in, sign out)
- **SuperAdminService** - 5 endpoints (CRUD operations for super admins)
- **PresetThemeService** - 5 endpoints (CRUD operations for themes)

All endpoints are fully typed with request/response interfaces! 🎉
