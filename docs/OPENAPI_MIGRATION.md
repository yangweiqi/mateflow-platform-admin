# Migration Guide: openapi-typescript-codegen to @hey-api/openapi-ts

This document describes the migration from `openapi-typescript-codegen` to `@hey-api/openapi-ts`.

## What Changed

### Package

- **Old**: `openapi-typescript-codegen@0.29.0`
- **New**: `@hey-api/openapi-ts@0.87.0`

### Configuration

- **Old**: Command-line arguments in `package.json`

  ```json
  "openapi": "openapi --input ./openapi.json --output ./src/services --client fetch"
  ```

- **New**: Configuration file `openapi-ts.config.ts`

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

### Generated File Structure

- **Old**:

  ```
  src/services/
  ├── core/
  │   ├── ApiError.ts
  │   ├── OpenAPI.ts
  │   └── request.ts
  ├── models/
  │   ├── SignInByEmailReqBody.ts
  │   └── ...
  ├── services/
  │   ├── AccountServiceService.ts
  │   └── ...
  └── index.ts
  ```

- **New**:
  ```
  src/services/
  ├── client/
  │   ├── client.gen.ts
  │   ├── types.gen.ts
  │   └── utils.gen.ts
  ├── core/
  │   ├── auth.gen.ts
  │   ├── types.gen.ts
  │   └── utils.gen.ts
  ├── client.gen.ts
  ├── sdk.gen.ts
  ├── types.gen.ts
  └── index.ts
  ```

## API Changes

### 1. Import Statements

**Old (Class-based Services)**:

```typescript
import { AccountServiceService } from '@/services';
import type { SignInByEmailReqBody } from '@/services/models/SignInByEmailReqBody';
```

**New (Function-based API)**:

```typescript
import { accountServiceSignInByEmail } from '@/services';
import type { SignInByEmailReqBody } from '@/services';
```

### 2. Service Calls

**Old**:

```typescript
const response = await AccountServiceService.accountServiceSignInByEmail({
  email: 'admin@example.com',
  password: 'password123',
});

// Response structure
if (response.code === 0 && response.data?.token) {
  console.log('Token:', response.data.token);
}
```

**New**:

```typescript
const response = await accountServiceSignInByEmail({
  body: {
    email: 'admin@example.com',
    password: 'password123',
  },
});

// Response structure (wrapped)
if (response.data?.code === 0 && response.data?.data?.token) {
  console.log('Token:', response.data.data.token);
}
```

### 3. Client Configuration

**Old (OpenAPI singleton)**:

```typescript
import { OpenAPI } from '@/services';

OpenAPI.BASE = 'http://localhost:8080';
OpenAPI.TOKEN = async () => getToken();
```

**New (Client instance)**:

```typescript
import { client } from '@/services/client.gen';

client.setConfig({
  baseUrl: 'http://localhost:8080',
});

client.interceptors.request.use(async (request) => {
  const token = getToken();
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});
```

### 4. Response Structure

**Old**: Direct API response

```typescript
{
  code: 0,
  msg: "Success",
  data: { token: "..." }
}
```

**New**: Wrapped response with request/response metadata

```typescript
{
  data: {
    code: 0,
    msg: "Success",
    data: { token: "..." }
  },
  request: Request,
  response: Response
}
```

## Migration Steps Applied

### 1. Package Updates

- ✅ Removed `openapi-typescript-codegen`
- ✅ Installed `@hey-api/openapi-ts`

### 2. Configuration

- ✅ Created `openapi-ts.config.ts`
- ✅ Updated `package.json` script to `openapi-ts`

### 3. Code Generation

- ✅ Regenerated services with new tool

### 4. Code Updates

- ✅ Updated `src/config/api.ts` to use new client API
- ✅ Updated `src/models/auth.ts` to use new function-based API
- ✅ Updated imports from `@/services/models/*` to `@/services`

### 5. Response Handling

- ✅ Updated response access from `response.code` to `response.data?.code`
- ✅ Updated data access from `response.data` to `response.data?.data`

### 6. Documentation

- ✅ Updated `docs/OPENAPI_SETUP.md`
- ✅ Created new `src/services/README.md`
- ✅ Created this migration guide

## Key Benefits of @hey-api/openapi-ts

1. **Better TypeScript Support**: Improved type inference and stricter types
2. **Modern Architecture**: Function-based API is more tree-shakeable
3. **Interceptors**: Built-in support for request/response/error interceptors
4. **Active Development**: Regular updates and bug fixes
5. **Better Error Handling**: More consistent error structure
6. **Flexible Client**: Easy to customize and extend

## Troubleshooting

### Response Structure Issues

If you see errors accessing response properties:

**Problem**: `response.code is undefined`

**Solution**: The response is now wrapped, access it as `response.data?.code`

### Type Import Errors

If you see errors importing types:

**Problem**: `Cannot find module '@/services/models/SignInByEmailReqBody'`

**Solution**: Import directly from `@/services`:

```typescript
import type { SignInByEmailReqBody } from '@/services';
```

### Service Not Found

If you see errors about services not being exported:

**Problem**: `AccountServiceService is not exported from '@/services'`

**Solution**: Use the function-based API:

```typescript
// Old
AccountServiceService.accountServiceSignInByEmail(...)

// New
accountServiceSignInByEmail({ body: ... })
```

## Testing the Migration

After migration, test these key flows:

1. ✅ Login flow (`accountServiceSignInByEmail`)
2. ✅ Token refresh (`accountServiceRefreshToken`)
3. ✅ Get current user (`accountServiceGetAdminMe`)
4. ✅ Logout (`accountServiceSignOut`)
5. ✅ API calls with authentication headers

## Rollback Plan

If issues arise, you can rollback:

1. Restore `openapi-typescript-codegen` in `package.json`
2. Restore old configuration in scripts
3. Revert changes to `src/config/api.ts` and `src/models/auth.ts`
4. Run `pnpm install` and `pnpm run openapi`

However, we recommend fixing forward as `@hey-api/openapi-ts` is the better long-term solution.

## References

- [@hey-api/openapi-ts Documentation](https://github.com/hey-api/openapi-ts)
- [Migration from openapi-typescript-codegen](https://github.com/hey-api/openapi-ts/blob/main/docs/migrating.md)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
