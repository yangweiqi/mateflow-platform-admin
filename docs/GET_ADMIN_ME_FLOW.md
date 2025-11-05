# Get Admin Me Feature - Flow Diagram

## Login Flow with Admin Info Fetch

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Login Flow                          │
└─────────────────────────────────────────────────────────────────┘

1. User enters credentials in Login Page
   │
   ├─► Form validation (email, password)
   │
   ├─► Gather security data (CAPTCHA, device fingerprint, CSRF)
   │
   └─► Call signIn() from auth model
       │
       ├─► POST /platform_admin_api/v1/account/sign_in_by_email
       │   │
       │   ├─► Success: Receive token
       │   │   │
       │   │   ├─► Store token in cookies/localStorage
       │   │   │
       │   │   ├─► Set session start time
       │   │   │
       │   │   ├─► Create secure session
       │   │   │
       │   │   └─► Call fetchAdminMe() ⭐ NEW
       │   │       │
       │   │       ├─► POST /platform_admin_api/v1/account/me
       │   │       │   │
       │   │       │   ├─► Success: Receive SuperAdminInfo
       │   │       │   │   {
       │   │       │   │     id, name, email,
       │   │       │   │     created_at, updated_at
       │   │       │   │   }
       │   │       │   │
       │   │       │   └─► Error: Continue without admin info
       │   │       │
       │   │       └─► Update currentUser state
       │   │           {
       │   │             email: "user@example.com",
       │   │             token: "jwt_token_here",
       │   │             adminInfo: { ... } ⭐ NEW
       │   │           }
       │   │
       │   ├─► Start auto-refresh timer
       │   │
       │   ├─► Start session monitoring
       │   │
       │   ├─► Login Page: Update initialState
       │   │   │
       │   │   └─► Propagate currentUser (with adminInfo) to global state
       │   │
       │   └─► Navigate to home page
       │
       └─► Error: Show error message
```

## App Initialization Flow with Admin Info

```
┌─────────────────────────────────────────────────────────────────┐
│                   App Initialization Flow                        │
└─────────────────────────────────────────────────────────────────┘

1. App loads (app.tsx - getInitialState())
   │
   ├─► Check if user is authenticated
   │   │
   │   ├─► Get token from storage
   │   │
   │   └─► Get email from storage
   │
   ├─► If authenticated:
   │   │
   │   ├─► Call fetchAdminMe() ⭐ NEW
   │   │   │
   │   │   ├─► POST /platform_admin_api/v1/account/me
   │   │   │   │
   │   │   │   ├─► Success: Receive SuperAdminInfo
   │   │   │   │
   │   │   │   └─► Error: Continue without admin info
   │   │   │
   │   │   └─► Return currentUser with adminInfo
   │   │       {
   │   │         token: "...",
   │   │         email: "...",
   │   │         adminInfo: { ... } ⭐ NEW
   │   │       }
   │   │
   │   └─► Set initialState with currentUser
   │
   └─► If not authenticated:
       │
       └─► Redirect to /login

2. Layout renders with initialState
   │
   └─► Avatar displays admin name from adminInfo ⭐ NEW
       │
       └─► Priority: adminInfo.name > adminInfo.email > email
```

## Token Refresh / User Reinitialization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Auth Model - initUser() Flow                        │
└─────────────────────────────────────────────────────────────────┘

1. Called from auth model initialization or manual reinitialization
   │
   ├─► Check and refresh token if needed
   │   │
   │   ├─► If token expired: Call refreshToken()
   │   │
   │   └─► If token valid: Continue with current token
   │
   ├─► Validate session security
   │   │
   │   ├─► Check device fingerprint
   │   │
   │   ├─► Check session validity
   │   │
   │   └─► If invalid: Clear session and logout
   │
   ├─► If session valid:
   │   │
   │   ├─► Get email from storage
   │   │
   │   ├─► Call fetchAdminMe() ⭐ NEW
   │   │   │
   │   │   └─► Fetch latest admin info from API
   │   │
   │   ├─► Update currentUser with adminInfo
   │   │
   │   ├─► Start auto-refresh timer
   │   │
   │   └─► Start session monitoring
   │
   └─► Return success/failure
```

## Data Flow Summary

```
┌──────────────────┐
│   Login Page     │
│                  │
│  signIn()        │
└────────┬─────────┘
         │
         │ calls
         ▼
┌──────────────────┐      ┌─────────────────────────┐
│   Auth Model     │      │  AccountServiceService  │
│                  ├─────►│                         │
│  fetchAdminMe()  │ POST │  accountServiceGetAdminMe()
│                  │◄─────┤                         │
└────────┬─────────┘      │  /account/me            │
         │                └─────────────────────────┘
         │ updates
         ▼
┌──────────────────┐
│  currentUser     │
│  {               │
│    email,        │
│    token,        │
│    adminInfo ⭐  │
│  }               │
└────────┬─────────┘
         │
         │ propagates to
         ▼
┌──────────────────┐
│  initialState    │
│  (@@initialState)│
└────────┬─────────┘
         │
         │ used by
         ▼
┌──────────────────┐
│  Layout / UI     │
│                  │
│  Avatar display  │
│  User profile    │
│  etc.            │
└──────────────────┘
```

## Key Points

1. **Admin info is fetched automatically** after successful login
2. **Admin info is fetched on app init** if user is already authenticated
3. **Graceful fallback** - app works even if admin info fetch fails
4. **Centralized storage** - admin info available via global state
5. **UI enhancement** - admin name displayed in layout avatar
6. **No breaking changes** - existing functionality preserved

## API Calls Made

### During Login

1. POST `/platform_admin_api/v1/account/sign_in_by_email` - Sign in
2. POST `/platform_admin_api/v1/account/me` - Get admin info ⭐ NEW

### During App Initialization (with existing token)

1. POST `/platform_admin_api/v1/account/me` - Get admin info ⭐ NEW

### During Token Refresh

1. POST `/platform_admin_api/v1/account/refresh_token` - Refresh token
2. (Admin info already loaded, no additional call needed)
