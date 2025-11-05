# OpenAPI-Umi Integration - Quick Reference

## What Was Added

OpenAPI-generated services now have **full feature parity** with Umi's request system.

## Features Implemented

### ✅ Authorization Token

- **Automatically included** in all OpenAPI service calls
- Retrieved dynamically from storage (cookies/localStorage)
- Matches Umi request interceptor behavior

### ✅ CSRF Token

- **Automatically added** to POST, PUT, DELETE, PATCH requests
- Skipped for GET requests
- Matches Umi request interceptor behavior

### ✅ Session Activity Tracking

- **Automatically updates** session activity on every request
- Prevents session timeout during active use
- Matches Umi request interceptor behavior

### ✅ Error Handling Utilities

- Centralized error handling for OpenAPI calls
- Consistent error messages (401, 403, 500, 429)
- Optional wrapper functions for convenience

## How to Use

### Option 1: Direct Call (Manual Error Handling)

```typescript
import { AccountServiceService } from '@/services';

try {
  const response = await AccountServiceService.accountServiceGetAdminMe();

  if (response.code === 0 && response.data) {
    console.log('Success:', response.data);
  }
} catch (error) {
  console.error('Error:', error);
  // Errors are already logged and handled by OpenAPI
}
```

### Option 2: With Error Handling Wrapper

```typescript
import { AccountServiceService } from '@/services';
import { withErrorHandling } from '@/utils/apiResponseHandler';

// Automatic error handling (401, 403, 500, 429)
const adminInfo = await withErrorHandling(() =>
  AccountServiceService.accountServiceGetAdminMe(),
);

if (adminInfo) {
  console.log('Admin info:', adminInfo);
}
```

### Option 3: With Custom Error Callback

```typescript
import { withErrorHandlingAndCallback } from '@/utils/apiResponseHandler';

const result = await withErrorHandlingAndCallback(
  () => AccountServiceService.accountServiceSignOut(),
  (error) => {
    console.log('Custom error handling:', error);
  },
);
```

## Configuration Details

### OpenAPI Configuration (src/config/api.ts)

```typescript
// Authorization token
OpenAPI.TOKEN = async () => {
  const token = getToken();
  return token || '';
};

// Additional headers (CSRF + Session tracking)
OpenAPI.HEADERS = async (options) => {
  const headers: Record<string, string> = {};

  // CSRF for non-GET requests
  if (options.method && options.method.toUpperCase() !== 'GET') {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  // Update session activity
  SessionSecurityManager.updateActivity();

  return headers;
};

// Credentials (cookies)
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';
```

## Headers Automatically Added

### For All Requests

- `Authorization: Bearer <token>`
- `Accept: application/json`
- `Content-Type: application/json` (for body requests)

### For Non-GET Requests Only

- `X-CSRF-Token: <csrf_token>`

## Error Handling

### Automatic Error Handling

When errors occur, the following actions are taken automatically:

| Status Code | Action | Message |
| --- | --- | --- |
| **401** | Clear session, redirect to /login | "Session expired, please login again" |
| **403** | Show error message | "Access denied" |
| **500** | Show error message | "Server error, please try again later" |
| **429** | Show warning message | "Too many requests. Please slow down." |

### Error Handler Utilities

```typescript
// src/utils/apiResponseHandler.ts

// Handle API error
handleApiError(error: any): void

// Wrap API call with error handling
withErrorHandling<T>(apiCall: () => Promise<T>): Promise<T | null>

// Wrap with custom error callback
withErrorHandlingAndCallback<T>(
  apiCall: () => Promise<T>,
  onError?: (error: any) => void
): Promise<T | null>

// Check if response is successful
isApiSuccess(response: any): boolean

// Get error message from response
getApiErrorMessage(response: any): string
```

## Request Flow

```
OpenAPI Service Call
    ↓
OpenAPI.TOKEN() → Get token from storage
    ↓
OpenAPI.HEADERS() → Add CSRF + Update session
    ↓
Request sent with headers:
  - Authorization: Bearer <token>
  - X-CSRF-Token: <csrf> (non-GET only)
    ↓
Response received
    ↓
Error? → handleApiError() → Show message + Handle (401, 403, etc.)
    ↓
Success → Return data
```

## Comparison: Umi vs OpenAPI

| Feature          | Umi Request          | OpenAPI Request       | Status  |
| ---------------- | -------------------- | --------------------- | ------- |
| Authorization    | Request interceptor  | `OpenAPI.TOKEN`       | ✅ Same |
| CSRF Token       | Request interceptor  | `OpenAPI.HEADERS`     | ✅ Same |
| Session Tracking | Request interceptor  | `OpenAPI.HEADERS`     | ✅ Same |
| Error Handling   | Response interceptor | Error handler utility | ✅ Same |
| Credentials      | Default              | `WITH_CREDENTIALS`    | ✅ Same |

## Testing

### Verify Token is Sent

1. Open DevTools → Network tab
2. Make an API call (e.g., login → fetch admin info)
3. Click on the request
4. Check Request Headers:
   - Should see: `Authorization: Bearer <token>`
   - Should see: `X-CSRF-Token: <csrf>` (for POST/PUT/DELETE)

### Verify Error Handling

```typescript
// Test 401 error
localStorage.removeItem('auth_token');
await AccountServiceService.accountServiceGetAdminMe();
// Should redirect to /login with error message

// Test 403 error
// (depends on backend permissions)
// Should show "Access denied" message

// Test 500 error
// (simulated by backend)
// Should show "Server error" message
```

## Files Reference

### Configuration

- `src/config/api.ts` - OpenAPI configuration

### Utilities

- `src/utils/apiResponseHandler.ts` - Error handling utilities
- `src/utils/auth.ts` - Token management
- `src/utils/csrf.ts` - CSRF token management
- `src/utils/sessionSecurity.ts` - Session tracking

### Services

- `src/services/core/request.ts` - OpenAPI request handler
- `src/services/core/OpenAPI.ts` - OpenAPI configuration types
- `src/services/services/*` - Generated service classes

### Documentation

- `docs/OPENAPI_UMI_INTEGRATION.md` - Detailed integration guide
- `docs/OPENAPI_INTEGRATION_QUICK_REF.md` - This quick reference
- `docs/TOKEN_AUTH_FIX.md` - Token authentication fix details

## Common Issues

### Issue: Token not included

**Check**: Is `initializeApiConfig()` called in app.tsx? **Solution**: Verify initialization happens before any API calls

### Issue: CSRF token missing

**Check**: Is the request method POST/PUT/DELETE/PATCH? **Solution**: CSRF is only added to non-GET requests

### Issue: Error messages not showing

**Check**: Are you catching errors? **Solution**: Use `withErrorHandling()` wrapper or handle in try-catch

### Issue: Session timing out too quickly

**Check**: Is `SessionSecurityManager.updateActivity()` being called? **Solution**: Verify OpenAPI.HEADERS is configured correctly

## Best Practices

### ✅ DO

```typescript
// Use error handling wrapper
const result = await withErrorHandling(() => ServiceClass.method());

// Check for success
if (result) {
  // Handle success
}
```

### ❌ DON'T

```typescript
// Don't ignore errors
const result = await ServiceClass.method(); // Unhandled errors!

// Don't manually add headers
const result = await ServiceClass.method({
  headers: { Authorization: 'Bearer token' }, // Not needed!
});
```

## Summary

✅ **All OpenAPI services automatically include**:

- Authorization token
- CSRF token (for mutations)
- Session activity tracking
- Error handling

✅ **No manual configuration needed** - just call the service methods!

✅ **Full feature parity with Umi request** - consistent behavior everywhere

✅ **Type-safe and maintainable** - TypeScript support with auto-generated code
