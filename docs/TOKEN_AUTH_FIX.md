# Token Authentication Fix for OpenAPI Services

## Issue

The `accountServiceGetAdminMe()` API call was not sending the authentication token that was stored in cookies. This was causing 401 Unauthorized errors when trying to fetch admin information.

## Root Cause

The OpenAPI-generated services (like `AccountServiceService`) use their own request handler (`src/services/core/request.ts`) which doesn't go through the Umi request interceptor defined in `app.tsx`.

While the app.tsx request interceptor adds the Authorization header:

```typescript
// app.tsx - This only works for Umi's request, not OpenAPI services
requestInterceptors: [
  (config: any) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
];
```

The OpenAPI client needs its own configuration to include the token.

## Solution

Updated `src/config/api.ts` to configure the OpenAPI client with a dynamic token resolver:

```typescript
import { OpenAPI } from '@/services';
import { getToken } from '@/utils/auth';

export function initializeApiConfig() {
  OpenAPI.BASE = API_BASE_URL;
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = 'include';

  // NEW: Configure token resolver to dynamically get token from storage
  OpenAPI.TOKEN = async () => {
    const token = getToken();
    return token || '';
  };
}
```

## How It Works

1. **Token Resolver Function**: The `OpenAPI.TOKEN` is set to an async function that dynamically retrieves the token from storage
2. **Dynamic Retrieval**: Each time an API call is made, the OpenAPI request handler calls this function to get the current token
3. **Authorization Header**: The OpenAPI request handler (in `src/services/core/request.ts`) automatically adds the token to the Authorization header:

```typescript
// From request.ts - getHeaders function (line 158-160)
if (isStringWithValue(token)) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

## Benefits

1. **Always Up-to-Date**: Token is retrieved dynamically on each request, ensuring the latest token is always used
2. **Works After Login**: Immediately after login when token is stored, subsequent API calls will have the token
3. **Works After Token Refresh**: When token is refreshed, new requests automatically use the new token
4. **No Manual Updates**: No need to manually update OpenAPI.TOKEN when the token changes

## Testing

To verify the fix:

1. **Check Network Tab**:

   - Login to the application
   - Open browser DevTools → Network tab
   - Look for the POST request to `/platform_admin_api/v1/account/me`
   - Check Request Headers → Should see `Authorization: Bearer <token>`

2. **Check Console**:

   - No "401 Unauthorized" errors
   - No "Fetch admin info error" messages
   - Admin info should be logged successfully

3. **Check UI**:
   - After login, admin name should appear in header avatar
   - Refresh page → admin info should load correctly

## Files Modified

- ✅ `src/config/api.ts` - Added dynamic token resolver

## Related Files

- `src/services/core/request.ts` - OpenAPI request handler (uses TOKEN config)
- `src/services/core/OpenAPI.ts` - OpenAPI configuration interface
- `src/app.tsx` - Umi request interceptor (for non-OpenAPI requests)
- `src/utils/auth.ts` - Token storage utilities

## Important Notes

1. **Two Request Systems**:

   - Umi's `request` (configured in app.tsx) - for manual API calls
   - OpenAPI's `request` (configured in api.ts) - for generated service calls

2. **Both Need Token Configuration**:

   - Umi request: Uses interceptor in app.tsx
   - OpenAPI request: Uses TOKEN in api.ts ✅ NOW FIXED

3. **Cookie Support**:
   - `WITH_CREDENTIALS: true` and `CREDENTIALS: 'include'` ensure cookies are sent
   - But for JWT tokens in localStorage, the Authorization header is required

## Alternative Approaches Considered

### Approach 1: Use Umi's Request for All API Calls ❌

- Would require rewriting all generated service code
- Defeats the purpose of code generation
- High maintenance burden

### Approach 2: Manually Add Token to Each Call ❌

```typescript
// Bad: Manual token passing
const response = await AccountServiceService.accountServiceGetAdminMe();
```

- No clean way to pass token to generated services
- Would require modifying generated code

### Approach 3: Use Request Interceptor at Fetch Level ❌

```typescript
// Monkey-patch fetch
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  // Add token here
};
```

- Too invasive
- Hard to maintain
- Can break other libraries

### Approach 4: Configure OpenAPI.TOKEN ✅ CHOSEN

```typescript
OpenAPI.TOKEN = async () => getToken() || '';
```

- Clean and standard
- Uses OpenAPI's built-in mechanism
- No code generation changes needed
- Automatically included in all requests

## Summary

The fix ensures that all OpenAPI-generated service calls (including `accountServiceGetAdminMe`) automatically include the authentication token in the Authorization header by configuring the OpenAPI client with a dynamic token resolver function.

This allows the "Get Admin Me" feature to work correctly after login, fetching the admin user's information securely with proper authentication.
