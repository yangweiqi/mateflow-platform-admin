# Authentication Quick Start Guide

## What Was Implemented

A complete JWT-based authentication system with:

1. ✅ **Login Page** (`/login`) with email/password form
2. ✅ **Token Storage** in localStorage
3. ✅ **Automatic Token Injection** in all HTTP requests
4. ✅ **Token Refresh** capability
5. ✅ **Logout** functionality with UI button
6. ✅ **Protected Routes** - automatic redirect to login
7. ✅ **Request/Response Interceptors** for error handling

## Quick Test

### 1. Start the Development Server

```bash
npm run dev
# or
pnpm dev
```

### 2. Access the Application

Open your browser and navigate to:

```
http://localhost:8000
```

You will be automatically redirected to:

```
http://localhost:8000/login
```

### 3. Login

Enter your credentials:

- **Email**: your-email@example.com
- **Password**: your-password

The form will:

- Validate email format
- Require password (minimum 6 characters)
- Show loading state during authentication
- Display error messages if login fails

### 4. After Successful Login

You will be redirected to the home page where you can see:

- Authentication status
- Token presence indicator
- Your email (if provided by the API)

### 5. Test Protected Routes

Try accessing these routes (all are protected):

- `/home` - Home page
- `/access` - Access page
- `/table` - CRUD Demo page

Without authentication, you'll be redirected to `/login`.

### 6. Logout

Click the **logout icon** (🔓) in the top-right corner of the header.

You will be:

- Logged out from the server
- Cleared from local storage
- Redirected to the login page

## How JWT Token Works

### Token Flow

```
┌─────────────┐
│ Login Form  │
└──────┬──────┘
       │
       │ POST /sign_in_by_email
       │ { email, password }
       ↓
┌──────────────────┐
│  API Server      │
└──────┬───────────┘
       │
       │ Response: { token: "eyJ..." }
       ↓
┌──────────────────┐
│  localStorage    │
│  admin_token     │
└──────┬───────────┘
       │
       │ Automatic injection
       ↓
┌──────────────────────────┐
│  All API Requests        │
│  Authorization: Bearer   │
│  eyJ...                  │
└──────────────────────────┘
```

### Token in HTTP Headers

Every API request automatically includes:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

This happens in two places:

1. **OpenAPI Generated Services** - Modified `src/services/core/request.ts` to read from localStorage
2. **Umi Request Plugin** - Request interceptor in `src/app.tsx`

## File Changes Summary

### New Files Created

```
src/
├── app.tsx                     # Runtime config (NEW - renamed from .ts)
├── utils/
│   └── auth.ts                # Token utilities (NEW)
├── models/
│   └── auth.ts                # Auth state management (NEW)
└── pages/
    └── Login/
        ├── index.tsx          # Login page (NEW)
        └── index.less         # Login styles (NEW)
```

### Modified Files

```
src/
├── access.ts                  # Updated for auth checking
├── pages/
│   └── Home/
│       └── index.tsx          # Added auth status display
├── services/
│   └── core/
│       └── request.ts         # Added token injection
└── .umirc.ts                  # Added login route & protected routes
```

## API Endpoints Required

Your backend must implement these endpoints (already in your OpenAPI spec):

### 1. Sign In

```http
POST /platform_admin_api/v1/account/sign_in_by_email
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response:
{
  "code": 0,
  "msg": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Sign Out

```http
POST /platform_admin_api/v1/account/sign_out
Authorization: Bearer <token>

Response:
{
  "code": 0,
  "msg": "success"
}
```

### 3. Refresh Token

```http
POST /platform_admin_api/v1/account/refresh_token
Authorization: Bearer <token>

Response:
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-10-30T12:00:00Z"
  }
}
```

## Using Auth in Your Components

### Access Current User

```typescript
import { useModel } from '@umijs/max';

export default function MyComponent() {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};

  return <div>Token: {currentUser?.token}</div>;
}
```

### Call Authenticated APIs

```typescript
import { AccountServiceService } from '@/services';

// Token is automatically added!
const result = await AccountServiceService.accountServiceSignOut();
```

### Manual Logout

```typescript
import { useModel } from '@umijs/max';

export default function MyComponent() {
  const { signOut } = useModel('auth');

  const handleLogout = async () => {
    await signOut();
    // User is logged out and redirected
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Check Authentication

```typescript
import { isAuthenticated } from '@/utils/auth';

if (isAuthenticated()) {
  // User is logged in
} else {
  // User needs to login
}
```

## Troubleshooting

### Issue: Redirected to login immediately after logging in

**Solution**: Check browser console for errors. Verify:

1. Token is stored in localStorage (key: `admin_token`)
2. API response includes the token in the correct format
3. No errors in `getInitialState()` function

### Issue: API requests return 401 Unauthorized

**Solution**:

1. Check if token is in localStorage
2. Verify token format in Authorization header
3. Check if token has expired
4. Verify backend is validating tokens correctly

### Issue: Can't access any pages

**Solution**:

1. Clear localStorage: `localStorage.clear()`
2. Refresh the page
3. Login again

### Issue: Logout button doesn't appear

**Solution**:

1. Check if `currentUser` is set in initialState
2. Verify token is stored after login
3. Check console for errors in `app.tsx`

## Development Tips

### View Token in Browser

Open DevTools Console:

```javascript
localStorage.getItem('admin_token');
```

### Clear Authentication

```javascript
localStorage.removeItem('admin_token');
localStorage.removeItem('admin_token_expires');
```

### Test Token Expiration

Modify expiration buffer in `src/utils/auth.ts`:

```typescript
// Change from 5 minutes to 5 seconds for testing
const bufferTime = 5 * 1000; // 5 seconds
```

## Next Steps

1. **Test with Real API**: Update `OpenAPI.BASE` in `.umirc.ts` to point to your backend
2. **Add User Profile**: Fetch user details after login
3. **Implement Token Refresh**: Add automatic refresh before expiration
4. **Add Remember Me**: Store refresh token for longer sessions
5. **Enhance Security**: Consider httpOnly cookies instead of localStorage

## Support

For detailed implementation information, see:

- `AUTH_IMPLEMENTATION.md` - Complete technical documentation
- `src/utils/auth.ts` - Token utilities source code
- `src/models/auth.ts` - Authentication model
- `src/app.tsx` - Runtime configuration
