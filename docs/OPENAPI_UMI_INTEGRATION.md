# OpenAPI and Umi Request Integration

## Overview

This document explains how OpenAPI-generated services are integrated with Umi's request system to ensure consistent behavior across all API calls.

## Two Request Systems

The application uses two different request mechanisms:

### 1. Umi Request System

- **Location**: `src/app.tsx` - `export const request: RequestConfig`
- **Used For**: Manual API calls using Umi's `request()` function
- **Features**: Request/response interceptors, timeout, error handling

### 2. OpenAPI Request System

- **Location**: `src/services/core/request.ts`
- **Used For**: Auto-generated service calls (e.g., `AccountServiceService`)
- **Features**: Type-safe API calls, automatic code generation

## Feature Parity Implementation

To ensure both systems behave consistently, we've implemented feature parity:

### ✅ Feature Comparison Table

| Feature | Umi Request (app.tsx) | OpenAPI Request (api.ts) | Status |
| --- | --- | --- | --- |
| **Base URL** | N/A (uses absolute URLs) | `OpenAPI.BASE` | ✅ Configured |
| **Authorization Token** | Request interceptor | `OpenAPI.TOKEN` | ✅ Configured |
| **CSRF Token** | Request interceptor | `OpenAPI.HEADERS` | ✅ Configured |
| **Session Activity Tracking** | Request interceptor | `OpenAPI.HEADERS` | ✅ Configured |
| **Credentials (Cookies)** | Default behavior | `OpenAPI.WITH_CREDENTIALS` | ✅ Configured |
| **401 Error Handling** | Response interceptor | ApiError catching | ✅ Via error handler |
| **403 Error Handling** | Response interceptor | ApiError catching | ✅ Via error handler |
| **500 Error Handling** | Response interceptor | ApiError catching | ✅ Via error handler |
| **429 Error Handling** | Response interceptor | ApiError catching | ✅ Via error handler |
| **Timeout** | 30000ms | Browser default | ⚠️ Uses browser default |

## Implementation Details

### 1. Authorization Token

**Umi Request:**

```typescript
// src/app.tsx
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

**OpenAPI Request:**

```typescript
// src/config/api.ts
OpenAPI.TOKEN = async () => {
  const token = getToken();
  return token || '';
};
```

**Result**: Both systems add `Authorization: Bearer <token>` header ✅

---

### 2. CSRF Token

**Umi Request:**

```typescript
// src/app.tsx
requestInterceptors: [
  (config: any) => {
    if (config.method && config.method.toUpperCase() !== 'GET') {
      const csrfToken = require('./utils/csrf').getCSRFToken();
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
];
```

**OpenAPI Request:**

```typescript
// src/config/api.ts
OpenAPI.HEADERS = async (options) => {
  const headers: Record<string, string> = {};

  if (options.method && options.method.toUpperCase() !== 'GET') {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return headers;
};
```

**Result**: Both systems add `X-CSRF-Token` header for non-GET requests ✅

---

### 3. Session Activity Tracking

**Umi Request:**

```typescript
// src/app.tsx
requestInterceptors: [
  (config: any) => {
    SessionSecurityManager.updateActivity();
    return config;
  },
];
```

**OpenAPI Request:**

```typescript
// src/config/api.ts
OpenAPI.HEADERS = async (options) => {
  try {
    SessionSecurityManager.updateActivity();
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
  return headers;
};
```

**Result**: Both systems update session activity on every request ✅

---

### 4. Error Handling

**Umi Request:**

```typescript
// src/app.tsx
responseInterceptors: [
  (response: any) => {
    if (response.status === 401) {
      message.error('Session expired, please login again');
      // Clear session and redirect...
    }
    // ... handle 403, 500, 429
    return response;
  },
];
```

**OpenAPI Request:**

```typescript
// src/utils/apiResponseHandler.ts
export function handleApiError(error: any): void {
  const status = error?.status || error?.statusCode;

  switch (status) {
    case 401:
      message.error('Session expired, please login again');
      // Clear session and redirect...
      break;
    case 403:
      message.error('Access denied');
      break;
    case 500:
      message.error('Server error, please try again later');
      break;
    case 429:
      message.warning('Too many requests. Please slow down.');
      break;
  }
}
```

**Usage:**

```typescript
// Wrap OpenAPI calls with error handling
const result = await withErrorHandling(() =>
  AccountServiceService.accountServiceGetAdminMe(),
);
```

**Result**: Both systems handle common HTTP errors consistently ✅

---

## Configuration Flow

### Application Startup

```
┌─────────────────────────────────────────────────────────────┐
│                    App Initialization                        │
└─────────────────────────────────────────────────────────────┘

1. app.tsx loads
   │
   ├─► initializeApiConfig() called
   │   │
   │   ├─► OpenAPI.BASE = API_BASE_URL
   │   │
   │   ├─► OpenAPI.TOKEN = async () => getToken()
   │   │
   │   ├─► OpenAPI.HEADERS = async (options) => {
   │   │     // Add CSRF token
   │   │     // Update session activity
   │   │   }
   │   │
   │   └─► OpenAPI.WITH_CREDENTIALS = true
   │
   └─► Umi request config loaded
       │
       ├─► requestInterceptors configured
       │
       └─► responseInterceptors configured
```

### API Call Flow Comparison

#### Umi Request Flow

```
API Call (manual)
    ↓
Umi request()
    ↓
Request Interceptor
    ├─► Add Authorization header
    ├─► Add CSRF token (non-GET)
    └─► Update session activity
    ↓
fetch()
    ↓
Response Interceptor
    └─► Handle errors (401, 403, 500, 429)
    ↓
Return to caller
```

#### OpenAPI Request Flow

```
API Call (generated service)
    ↓
OpenAPI request()
    ↓
getHeaders()
    ├─► Resolve OpenAPI.TOKEN → Add Authorization header
    └─► Resolve OpenAPI.HEADERS → Add CSRF token + Update activity
    ↓
fetch()
    ↓
catchErrorCodes()
    └─► Throw ApiError for error statuses
    ↓
Catch block in caller
    └─► handleApiError() → Handle errors (401, 403, 500, 429)
    ↓
Return to caller
```

## Usage Examples

### Example 1: Using OpenAPI Service with Error Handling

```typescript
import { AccountServiceService } from '@/services';
import { withErrorHandling } from '@/utils/apiResponseHandler';

// Automatic error handling
const adminInfo = await withErrorHandling(() =>
  AccountServiceService.accountServiceGetAdminMe(),
);

if (adminInfo) {
  console.log('Admin info:', adminInfo);
}
```

### Example 2: Using OpenAPI Service with Custom Error Handling

```typescript
import { AccountServiceService } from '@/services';
import { withErrorHandlingAndCallback } from '@/utils/apiResponseHandler';

const result = await withErrorHandlingAndCallback(
  () => AccountServiceService.accountServiceSignOut(),
  (error) => {
    console.log('Logout failed:', error);
    // Custom error handling
  },
);
```

### Example 3: Direct API Call (Error Handling in Try-Catch)

```typescript
import { AccountServiceService } from '@/services';
import { handleApiError } from '@/utils/apiResponseHandler';

try {
  const response = await AccountServiceService.accountServiceGetAdminMe();

  if (response.code === 0 && response.data) {
    console.log('Success:', response.data);
  }
} catch (error) {
  handleApiError(error); // Manual error handling
}
```

## Files Modified/Created

### Core Configuration

1. ✅ `src/config/api.ts` - Enhanced OpenAPI configuration
   - Added `OpenAPI.TOKEN` for authorization
   - Added `OpenAPI.HEADERS` for CSRF and session tracking
   - Configured credentials

### Utilities

2. ✅ `src/utils/apiResponseHandler.ts` - NEW
   - Error handling utilities
   - Response wrapper functions
   - Consistent error messages

### Documentation

3. ✅ `docs/OPENAPI_UMI_INTEGRATION.md` - This file

## Benefits

### 1. Consistency

- All API calls behave the same way regardless of which system makes them
- Users see consistent error messages
- Security features (CSRF, auth) applied uniformly

### 2. Maintainability

- Single source of truth for configuration
- Easy to update security policies
- No need to modify generated code

### 3. Type Safety

- OpenAPI services provide full TypeScript types
- Compile-time error checking
- Better IDE autocomplete

### 4. Security

- Token automatically included in all requests
- CSRF protection on all mutations
- Session tracking prevents unauthorized access

## Testing

### Test Authorization Token

```typescript
// 1. Login
await signIn({ email: 'admin@example.com', password: 'password' });

// 2. Make API call
const response = await AccountServiceService.accountServiceGetAdminMe();

// 3. Check network tab
// Request Headers should include:
// - Authorization: Bearer <token>
// - X-CSRF-Token: <csrf_token>
```

### Test CSRF Token

```typescript
// CSRF should be added for POST, PUT, DELETE, PATCH
const response = await AccountServiceService.accountServiceSignOut();

// Check network tab - should have X-CSRF-Token header
```

### Test Error Handling

```typescript
// Test 401 error
// 1. Clear token from storage
localStorage.removeItem('auth_token');

// 2. Make authenticated request
await AccountServiceService.accountServiceGetAdminMe();

// Should see:
// - Error message: "Session expired, please login again"
// - Redirect to /login
```

## Troubleshooting

### Issue: Token not included in OpenAPI requests

**Solution**: Check that `initializeApiConfig()` is called in app.tsx before any API calls

### Issue: CSRF token not included

**Solution**: Verify that the request method is not GET (CSRF only added to mutations)

### Issue: Error messages not showing

**Solution**: Wrap API calls with `withErrorHandling()` or handle errors in try-catch

### Issue: Session not tracking activity

**Solution**: Check that `SessionSecurityManager` is properly initialized

## Future Enhancements

### Potential Improvements

1. **Request Timeout**: Add timeout configuration to OpenAPI config
2. **Request Retry**: Implement automatic retry for failed requests
3. **Request Queue**: Queue requests when offline, send when back online
4. **Request Caching**: Cache GET requests for better performance
5. **Request Logging**: Log all API calls for debugging
6. **Request Metrics**: Track API call performance

### Implementation Example: Timeout

```typescript
// Could be added to OpenAPI config
OpenAPI.TIMEOUT = 30000; // 30 seconds

// Would need to modify request.ts to use AbortController with timeout
```

## Summary

✅ **OpenAPI services now have feature parity with Umi request** ✅ **Authorization token automatically included** ✅ **CSRF protection for mutations** ✅ **Session activity tracking** ✅ **Consistent error handling** ✅ **Type-safe API calls**

Both request systems work together seamlessly to provide a secure, consistent, and maintainable API layer.
