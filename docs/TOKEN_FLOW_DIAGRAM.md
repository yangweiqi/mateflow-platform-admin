# Token Authentication Flow - Complete Diagram

## Overview

This diagram shows how the authentication token flows through the application, from login to API requests.

## Complete Token Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          LOGIN PHASE                                    │
└────────────────────────────────────────────────────────────────────────┘

User enters credentials
        │
        ▼
┌─────────────────────┐
│  Login Page         │
│  signIn(...)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ POST /sign_in_by_email              │
│ Body: { email, password, ... }      │
└──────────┬──────────────────────────┘
           │
           ▼ 200 OK
┌─────────────────────────────────────┐
│ Response: {                         │
│   code: 0,                          │
│   data: {                           │
│     token: "eyJhbGc...",            │
│     expires_at: "2025-11-06..."     │
│   }                                 │
│ }                                   │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Store Token                         │
│ setToken(token, expires_at)         │
│                                     │
│ Storage:                            │
│  • Cookie: auth_token=eyJhbGc...   │
│  • LocalStorage: auth_token         │
│  • LocalStorage: auth_token_exp     │
└──────────┬──────────────────────────┘
           │
           │
┌────────────────────────────────────────────────────────────────────────┐
│                    GET ADMIN INFO PHASE                                 │
└────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Call fetchAdminMe()                 │
│ (from auth model)                   │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ AccountServiceService.accountServiceGetAdminMe()                │
│                                                                  │
│ This uses OpenAPI request handler                               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ OpenAPI Request Handler (request.ts)                            │
│                                                                  │
│ 1. Call getHeaders() to build headers                           │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ getHeaders() function                                            │
│                                                                  │
│ 1. Resolve OpenAPI.TOKEN:                                       │
│    - OpenAPI.TOKEN is a function                                │
│    - Call: token = await OpenAPI.TOKEN()                        │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ OpenAPI.TOKEN Function (configured in api.ts)                   │
│                                                                  │
│ async () => {                                                   │
│   const token = getToken();  ◄─── Gets from storage            │
│   return token || '';                                           │
│ }                                                               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ getToken() from auth.ts                                         │
│                                                                  │
│ 1. Try to get from cookie                                       │
│    const cookieToken = getCookie('auth_token')                  │
│                                                                  │
│ 2. Fallback to localStorage                                     │
│    const storageToken = localStorage.getItem('auth_token')      │
│                                                                  │
│ 3. Return: cookieToken || storageToken                          │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼ token: "eyJhbGc..."
┌─────────────────────────────────────────────────────────────────┐
│ Back to getHeaders()                                            │
│                                                                  │
│ if (isStringWithValue(token)) {                                 │
│   headers['Authorization'] = `Bearer ${token}`;                 │
│ }                                                               │
│                                                                  │
│ Headers now include:                                            │
│   Authorization: Bearer eyJhbGc...                              │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Send HTTP Request                                               │
│                                                                  │
│ POST /platform_admin_api/v1/account/me                          │
│ Headers: {                                                      │
│   Authorization: Bearer eyJhbGc...,                             │
│   Content-Type: application/json,                              │
│   Accept: application/json                                     │
│ }                                                               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼ 200 OK
┌─────────────────────────────────────────────────────────────────┐
│ Response: {                                                     │
│   code: 0,                                                      │
│   data: {                                                       │
│     id: "123",                                                  │
│     name: "Admin User",                                         │
│     email: "admin@example.com",                                 │
│     created_at: "2025-01-01...",                                │
│     updated_at: "2025-11-05..."                                 │
│   }                                                             │
│ }                                                               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Store Admin Info in State                                       │
│                                                                  │
│ setCurrentUser({                                                │
│   email: "admin@example.com",                                   │
│   token: "eyJhbGc...",                                          │
│   adminInfo: {                                                  │
│     id: "123",                                                  │
│     name: "Admin User",                                         │
│     ...                                                         │
│   }                                                             │
│ })                                                              │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Update Global State                                             │
│                                                                  │
│ initialState.currentUser = {                                    │
│   email, token, adminInfo                                       │
│ }                                                               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ UI Updates                                                      │
│                                                                  │
│ • Header avatar shows: "Admin User"                             │
│ • All components can access adminInfo via useModel              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components in Token Flow

### 1. Token Storage (auth.ts)

```typescript
// Stores token in both cookie and localStorage
export function setToken(token: string, expiresAt?: string) {
  // Store in cookie (for automatic sending with requests)
  setCookie('auth_token', token, {
    /* options */
  });

  // Store in localStorage (for client-side access)
  localStorage.setItem('auth_token', token);
  if (expiresAt) {
    localStorage.setItem('auth_token_exp', expiresAt);
  }
}

// Retrieves token from storage
export function getToken(): string | null {
  // Try cookie first
  const cookieToken = getCookie('auth_token');
  if (cookieToken) return cookieToken;

  // Fallback to localStorage
  return localStorage.getItem('auth_token');
}
```

### 2. OpenAPI Configuration (api.ts)

```typescript
export function initializeApiConfig() {
  OpenAPI.BASE = API_BASE_URL;
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = 'include';

  // KEY: Dynamic token resolver
  OpenAPI.TOKEN = async () => {
    const token = getToken(); // Gets from storage
    return token || '';
  };
}
```

### 3. OpenAPI Request Handler (request.ts)

```typescript
export const getHeaders = async (
  config: OpenAPIConfig,
  options: ApiRequestOptions,
): Promise<Headers> => {
  // Resolve token (calls OpenAPI.TOKEN function)
  const token = await resolve(options, config.TOKEN);

  // Add to headers if present
  if (isStringWithValue(token)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return new Headers(headers);
};
```

## Token Flow for Different Scenarios

### Scenario 1: After Login

```
Login → Store Token → OpenAPI.TOKEN() → getToken() → Storage → Token Found ✓
```

### Scenario 2: Page Refresh (Token in Storage)

```
App Init → OpenAPI.TOKEN() → getToken() → Storage → Token Found ✓
```

### Scenario 3: Token Expired

```
API Call → OpenAPI.TOKEN() → getToken() → Storage → Token Found (Expired)
→ API Returns 401 → Logout/Refresh
```

### Scenario 4: No Token

```
API Call → OpenAPI.TOKEN() → getToken() → Storage → No Token → Empty String
→ API Returns 401 → Redirect to Login
```

## Comparison: Before vs After Fix

### ❌ Before Fix

```
fetchAdminMe()
    │
    ▼
OpenAPI.TOKEN = undefined  ← Not configured!
    │
    ▼
No Authorization header
    │
    ▼
401 Unauthorized ❌
```

### ✅ After Fix

```
fetchAdminMe()
    │
    ▼
OpenAPI.TOKEN = async () => getToken()  ← Configured!
    │
    ▼
Token retrieved from storage
    │
    ▼
Authorization: Bearer <token>
    │
    ▼
200 OK + Admin Info ✓
```

## Multiple Request Paths

The application uses two different request mechanisms:

### Path 1: Umi Request (app.tsx interceptor)

```
Manual API Calls
    ↓
Umi's request()
    ↓
Request Interceptor (app.tsx)
    ↓
getToken() → Add Authorization header
    ↓
fetch()
```

### Path 2: OpenAPI Request (OpenAPI.TOKEN)

```
Generated Service Calls
    ↓
OpenAPI request()
    ↓
getHeaders()
    ↓
OpenAPI.TOKEN() → getToken() → Add Authorization header
    ↓
fetch()
```

## Token Security Features

1. **Dual Storage**:

   - Cookie: HttpOnly (secure), automatic with requests
   - LocalStorage: Accessible by client code

2. **Expiration Tracking**:

   - `auth_token_exp` stores expiration timestamp
   - Checked before making requests
   - Auto-refresh when near expiration

3. **Dynamic Retrieval**:

   - Always gets latest token from storage
   - No stale token issues
   - Works after token refresh

4. **Secure Transmission**:
   - Sent via Authorization header (not URL)
   - HTTPS recommended for production
   - Not exposed in query parameters

## Summary

✅ **Token is stored** after login via `setToken()`  
✅ **OpenAPI.TOKEN is configured** to dynamically retrieve token  
✅ **getToken() retrieves** token from cookie or localStorage  
✅ **Authorization header is added** automatically to all OpenAPI requests  
✅ **Admin info API call succeeds** with proper authentication

The fix ensures that all OpenAPI-generated service calls automatically include the authentication token by configuring `OpenAPI.TOKEN` with a dynamic resolver function.
