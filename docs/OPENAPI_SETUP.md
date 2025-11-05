# OpenAPI Setup Complete ✅

## What Was Done

The OpenAPI code generation has been successfully configured for your Umi 4 / @umijs/max project.

### Changes Made

1. **Installed `openapi-typescript-codegen`** - A tool that generates TypeScript API clients from OpenAPI specifications

   - Added to `devDependencies` in `package.json`

2. **Updated npm script** - Modified the `openapi` script in `package.json` to use the new tool:

   ```json
   "openapi": "openapi --input ./openapi.json --output ./src/services --client fetch"
   ```

3. **Generated API Services** - Created TypeScript API client code in `src/services/`:
   - `services/` - Service classes for each API endpoint group
     - `AccountServiceService.ts` - Authentication endpoints
     - `SuperAdminServiceService.ts` - Super admin management
     - `PresetThemeServiceService.ts` - Theme management
   - `models/` - TypeScript types for all request/response bodies
   - `core/` - Core API infrastructure (request handler, error types, etc.)
   - `index.ts` - Main export file
   - `README.md` - Documentation on how to use the generated code

### Why Not @umijs/plugin-openapi?

The `@umijs/plugin-openapi` package only works with Umi 3.x. Since your project uses Umi 4.x / @umijs/max 4.5.3, we used `openapi-typescript-codegen` instead, which:

- Works with any framework
- Generates clean, type-safe TypeScript code
- Provides the same functionality
- Is actively maintained

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
import { AccountServiceService } from '@/services';

// Example: Sign in
const response = await AccountServiceService.accountServiceSignInByEmail({
  email: 'admin@example.com',
  password: 'password123',
});
```

## Documentation

See `src/services/README.md` for detailed usage examples and API documentation.

## Available APIs

Your OpenAPI spec includes 3 service groups:

- **AccountService** - 3 endpoints (refresh token, sign in, sign out)
- **SuperAdminService** - 5 endpoints (CRUD operations for super admins)
- **PresetThemeService** - 5 endpoints (CRUD operations for themes)

All endpoints are fully typed with request/response interfaces! 🎉
