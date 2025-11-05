# Authentication Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Browser                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │  Login Page  │      │  Home Page   │      │  Other Pages │      │
│  │  /login      │      │  /home       │      │  /access     │      │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘      │
│         │                     │                      │              │
│         │                     │                      │              │
│         └─────────────────────┴──────────────────────┘              │
│                               │                                      │
│                               ↓                                      │
│                     ┌──────────────────┐                            │
│                     │   Auth Model     │                            │
│                     │  (useModel)      │                            │
│                     │                  │                            │
│                     │ • signIn()       │                            │
│                     │ • signOut()      │                            │
│                     │ • refreshToken() │                            │
│                     └────────┬─────────┘                            │
│                              │                                       │
│                              ↓                                       │
│                     ┌──────────────────┐                            │
│                     │   Auth Utils     │                            │
│                     │                  │                            │
│                     │ • getToken()     │                            │
│                     │ • setToken()     │                            │
│                     │ • isAuthenticated()                           │
│                     └────────┬─────────┘                            │
│                              │                                       │
│                              ↓                                       │
│                     ┌──────────────────┐                            │
│                     │  localStorage    │                            │
│                     │                  │                            │
│                     │  admin_token     │                            │
│                     │  admin_token_    │                            │
│                     │    expires       │                            │
│                     └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTP Requests
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Request Interceptor Layer                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Read token from localStorage                                     │
│  2. Add to headers: Authorization: Bearer <token>                   │
│  3. Send request                                                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Backend API Server                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POST /platform_admin_api/v1/account/sign_in_by_email               │
│  POST /platform_admin_api/v1/account/sign_out                       │
│  POST /platform_admin_api/v1/account/refresh_token                  │
│  GET  /platform_admin_api/v1/...  (other protected endpoints)       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Response Interceptor Layer                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  • 200 OK → Pass through                                            │
│  • 401 Unauthorized → Clear auth, redirect to /login               │
│  • 500 Server Error → Show error message                            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### 1. Initial Page Load

```
User navigates to app
         ↓
    getInitialState()
         ↓
Check localStorage for token
         ↓
    Token exists?
    ↙         ↘
  Yes          No
   ↓            ↓
Load user    Redirect to
   data       /login
   ↓
Access granted
```

### 2. Login Flow

```
User enters credentials
         ↓
    Form validation
         ↓
  POST /sign_in_by_email
    {email, password}
         ↓
    Backend validates
         ↓
  Success? ─────No────→ Show error message
    │                        ↑
   Yes                       │
    ↓                        │
Store token in              │
  localStorage              │
    ↓                        │
Update initialState        │
    ↓                        │
Redirect to /home          │
    ↓                        │
User authenticated ─────────┘
```

### 3. API Request Flow

```
Component calls API
         ↓
Request Interceptor
         ↓
Get token from localStorage
         ↓
    Token exists?
    ↙         ↘
  Yes          No
   ↓            ↓
Add Auth      Proceed
 header      without auth
   ↓            ↓
   └────┬───────┘
        ↓
   Send request
        ↓
   Get response
        ↓
Response Interceptor
        ↓
    Check status
    ↙    ↓    ↘
  200   401   500
   ↓     ↓     ↓
  OK   Logout Error
       +      msg
     Redirect
```

### 4. Logout Flow

```
User clicks logout
         ↓
    signOut()
         ↓
POST /sign_out (notify server)
         ↓
Clear localStorage
   (admin_token)
   (admin_token_expires)
         ↓
Update initialState
  (currentUser = undefined)
         ↓
Redirect to /login
         ↓
User logged out
```

### 5. Protected Route Access

```
User navigates to protected route
         ↓
    onPageChange()
         ↓
  Check authentication
         ↓
    isAuthenticated?
    ↙            ↘
  Yes             No
   ↓               ↓
Access        Redirect to
granted         /login
   ↓
Show page
```

## Component Relationships

```
app.tsx (Runtime Config)
    │
    ├── getInitialState()
    │   └── Returns: { currentUser, fetchUserInfo }
    │
    ├── layout()
    │   ├── avatarProps (show user info)
    │   ├── actionsRender (logout button)
    │   └── onPageChange (route protection)
    │
    └── request
        ├── requestInterceptors (add token)
        └── responseInterceptors (handle errors)

access.ts (Permissions)
    │
    └── Returns: { isAuthenticated, canSeeAdmin }

models/auth.ts (State Management)
    │
    ├── currentUser (state)
    ├── loading (state)
    ├── signIn() (action)
    ├── signOut() (action)
    ├── refreshToken() (action)
    └── initUser() (action)

utils/auth.ts (Token Utils)
    │
    ├── setToken()
    ├── getToken()
    ├── removeToken()
    ├── clearAuth()
    ├── isAuthenticated()
    └── isTokenExpired()

pages/Login/index.tsx (UI)
    │
    ├── Form (email, password)
    └── Uses auth model
```

## Data Flow

### State Management

```
┌─────────────────────┐
│   localStorage      │
│   (Persistent)      │
│                     │
│ • admin_token       │
│ • admin_token_expires
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   initialState      │
│   (Global)          │
│                     │
│ • currentUser       │
│ • fetchUserInfo     │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   auth model        │
│   (Reactive)        │
│                     │
│ • currentUser       │
│ • loading           │
│ • actions...        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Components        │
│   (UI)              │
│                     │
│ • Login Page        │
│ • Home Page         │
│ • Other Pages       │
└─────────────────────┘
```

### Token Injection Points

```
HTTP Request
     │
     ├─── OpenAPI Services
     │         │
     │         ↓
     │    src/services/core/request.ts
     │         │
     │         ↓
     │    getHeaders()
     │         │
     │         └→ Read localStorage → Add Bearer token
     │
     └─── Umi Request Plugin
               │
               ↓
          src/app.tsx
               │
               ↓
       requestInterceptors
               │
               └→ Read localStorage → Add Bearer token
```

## Security Layers

```
┌─────────────────────────────────────────┐
│ Layer 1: Client-Side Route Protection  │ ← access.ts, onPageChange
├─────────────────────────────────────────┤
│ Layer 2: Token Expiration Checking     │ ← isTokenExpired()
├─────────────────────────────────────────┤
│ Layer 3: Automatic Token Injection     │ ← Request Interceptors
├─────────────────────────────────────────┤
│ Layer 4: Response Error Handling       │ ← Response Interceptors
├─────────────────────────────────────────┤
│ Layer 5: Server-Side Validation        │ ← Backend API
└─────────────────────────────────────────┘
```

## File Dependencies

```
app.tsx
  ├── imports: utils/auth.ts
  └── exports: InitialState, getInitialState, layout, request

access.ts
  ├── imports: app.tsx (InitialState)
  └── exports: access checker function

models/auth.ts
  ├── imports: utils/auth.ts
  ├── imports: services/AccountServiceService
  └── exports: useAuthModel

pages/Login/index.tsx
  ├── imports: models/auth (useModel)
  └── exports: LoginPage component

utils/auth.ts
  ├── imports: none (pure utilities)
  └── exports: token management functions

services/core/request.ts
  ├── imports: OpenAPI types
  ├── reads: localStorage (admin_token)
  └── exports: request function
```

## Integration Points

### 1. Umi Framework Integration

- **initialState**: Managed by Umi's initial state plugin
- **access**: Managed by Umi's access plugin
- **request**: Managed by Umi's request plugin
- **model**: Managed by Umi's model plugin
- **layout**: Managed by Umi's layout plugin

### 2. Ant Design Integration

- Login form uses Ant Design components
- Messages use Ant Design message API
- Layout uses Ant Design Pro components

### 3. OpenAPI Integration

- Services auto-generated from openapi.json
- Request interceptor works with generated services
- Type-safe API calls

## Token Lifecycle

```
┌─────────────┐
│  User Login │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│  Token Created   │ ← Server generates JWT
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│  Token Stored    │ ← localStorage.setItem('admin_token', token)
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│  Token Active    │ ← Used in all API requests
└──────┬───────────┘
       │
       ↓
   Token expires soon?
    ↙         ↘
  Yes          No
   ↓            ↓
┌─────────┐  Continue
│ Refresh │   using
│  Token  │
└────┬────┘
     │
     └────→ Continue using
              │
              ↓
          User logs out
              │
              ↓
┌──────────────────┐
│  Token Deleted   │ ← localStorage.removeItem('admin_token')
└──────────────────┘
```

## Error Handling Flow

```
API Request Error
        │
        ↓
Response Interceptor
        │
        ├─── 401 Unauthorized
        │         │
        │         ├→ Show message: "Session expired"
        │         ├→ Clear localStorage
        │         └→ Redirect to /login
        │
        ├─── 500 Server Error
        │         │
        │         └→ Show message: "Server error"
        │
        └─── Other errors
                  │
                  └→ Pass through to component
```

## Best Practices Implemented

1. ✅ **Single Source of Truth**: Token stored only in localStorage
2. ✅ **Automatic Injection**: No manual header management needed
3. ✅ **Error Boundary**: Interceptors catch all auth errors
4. ✅ **Type Safety**: TypeScript types for all interfaces
5. ✅ **Separation of Concerns**: Utils, models, UI separated
6. ✅ **User Feedback**: Loading states and messages
7. ✅ **Security**: Token expiration buffer, automatic cleanup
8. ✅ **Scalability**: Easy to add new protected routes

## Performance Characteristics

- **Token Retrieval**: O(1) from localStorage
- **Token Validation**: O(1) timestamp comparison
- **Route Protection**: O(1) permission check
- **Memory Usage**: Minimal (only token string stored)
- **Network Overhead**: Only Auth header (~100 bytes)

## Summary

This architecture provides:

- 🔐 **Secure** token-based authentication
- 🚀 **Fast** localStorage access
- 🎯 **Simple** API for developers
- 🛡️ **Robust** error handling
- 📱 **Scalable** design for growth
- ✨ **Modern** React/TypeScript patterns
