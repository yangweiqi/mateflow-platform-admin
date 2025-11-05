# Authentication Implementation Guide

This document describes the complete authentication system implemented for the MateFlow Platform Admin.

## Overview

A complete JWT-based authentication system has been implemented with the following features:

- ✅ Admin login page with email/password
- ✅ JWT token storage in localStorage
- ✅ Automatic token refresh
- ✅ Token expiration checking
- ✅ Authorization header injection for all HTTP requests
- ✅ Logout functionality
- ✅ Protected routes with access control
- ✅ Automatic redirect to login for unauthenticated users
- ✅ Request/Response interceptors for token management

## File Structure

```
src/
├── app.tsx                    # Runtime configuration with auth logic
├── access.ts                  # Access control definitions
├── utils/
│   └── auth.ts               # Token storage and management utilities
├── models/
│   └── auth.ts               # Authentication state management
└── pages/
    └── Login/
        ├── index.tsx         # Login page component
        └── index.less        # Login page styles
```

## Core Components

### 1. Auth Utilities (`src/utils/auth.ts`)

Handles all token storage and management operations:

- `setToken(token, expiresAt)` - Store JWT token in localStorage
- `getToken()` - Retrieve stored token
- `removeToken()` - Remove token from storage
- `clearAuth()` - Clear all authentication data
- `isAuthenticated()` - Check if user is authenticated
- `isTokenExpired()` - Check if token has expired (with 5-minute buffer)
- `getAuthHeaders()` - Get authorization headers for API requests

### 2. Auth Model (`src/models/auth.ts`)

Manages authentication state using Umi's model system:

- `signIn(credentials)` - Sign in with email and password
- `signOut()` - Sign out and clear authentication
- `refreshToken()` - Refresh the JWT token
- `checkAndRefreshToken()` - Check expiration and refresh if needed
- `initUser()` - Initialize user from stored token

### 3. Login Page (`src/pages/Login/index.tsx`)

A beautiful, modern login form with:

- Email validation
- Password validation (minimum 6 characters)
- Loading state during authentication
- Error handling
- Automatic redirect after successful login
- Responsive design

### 4. App Configuration (`src/app.tsx`)

Runtime configuration that handles:

- **Initial State**: Loads user authentication state on app startup
- **Layout Configuration**:
  - Shows user info in header
  - Logout button in the top right
  - Automatic redirect to login for unauthenticated users
- **Request Interceptors**: Automatically adds JWT token to all API requests
- **Response Interceptors**: Handles 401 (unauthorized) and 500 (server error) responses

### 5. Access Control (`src/access.ts`)

Defines permission rules:

- `isAuthenticated` - Check if user has valid token
- `canSeeAdmin` - Permission to access admin pages

## How It Works

### Login Flow

1. User enters email and password on `/login` page
2. Form validates input
3. Credentials are sent to `/platform_admin_api/v1/account/sign_in_by_email`
4. On success:
   - Token is stored in localStorage
   - User state is updated
   - User is redirected to home page
5. On failure:
   - Error message is displayed

### Token Management

1. **Storage**: Tokens are stored in localStorage with key `admin_token`
2. **Injection**: Every HTTP request automatically includes the token in the Authorization header
3. **Expiration**: Tokens are checked for expiration (with 5-minute buffer)
4. **Refresh**: Tokens can be automatically refreshed before expiration

### Protected Routes

All routes except `/login` are protected:

```typescript
{
  name: 'Home',
  path: '/home',
  component: './Home',
  access: 'isAuthenticated',  // ✅ Protected
}
```

If an unauthenticated user tries to access a protected route, they are automatically redirected to `/login`.

### Logout Flow

1. User clicks logout icon in the header
2. API call is made to `/platform_admin_api/v1/account/sign_out`
3. Local authentication data is cleared
4. User state is reset
5. User is redirected to login page

## API Endpoints Used

The implementation uses these endpoints from your OpenAPI specification:

- `POST /platform_admin_api/v1/account/sign_in_by_email` - Login
- `POST /platform_admin_api/v1/account/sign_out` - Logout
- `POST /platform_admin_api/v1/account/refresh_token` - Refresh JWT token

## Token Format

The system expects JWT tokens in the following format:

```
Authorization: Bearer <token>
```

## Configuration

### Token Storage Keys

- `admin_token` - Stores the JWT token
- `admin_token_expires` - Stores the token expiration time

### Token Expiration Buffer

The system considers a token expired 5 minutes before its actual expiration time to ensure requests don't fail due to timing issues.

## Usage Examples

### In a Component

```typescript
import { useModel } from '@umijs/max';

export default function MyComponent() {
  const { currentUser, signOut } = useModel('auth');

  return (
    <div>
      <p>Token: {currentUser?.token}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Manual API Calls with Auth

The token is automatically included in all requests. For the services generated from OpenAPI:

```typescript
import { AccountServiceService } from '@/services';

// Token is automatically added to headers
const result = await AccountServiceService.accountServiceSignOut();
```

### Check Authentication Status

```typescript
import { isAuthenticated } from '@/utils/auth';

if (isAuthenticated()) {
  // User is logged in
} else {
  // User is not logged in
}
```

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage. For higher security, consider using httpOnly cookies.
2. **HTTPS**: Always use HTTPS in production to prevent token interception.
3. **Token Expiration**: Tokens should have a reasonable expiration time (e.g., 1-24 hours).
4. **Refresh Strategy**: Implement automatic token refresh before expiration.

## Testing

To test the authentication system:

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:8000`
3. You should be redirected to `/login`
4. Enter valid credentials
5. After successful login, you'll be redirected to the home page
6. The logout button appears in the header
7. Try accessing protected routes - you should be able to access them
8. Click logout - you should be redirected to login page

## Troubleshooting

### "Session expired" message appears repeatedly

- Check if the token refresh endpoint is working correctly
- Verify token expiration time in the API response

### Login successful but redirects back to login

- Check browser console for errors
- Verify token is being stored in localStorage
- Check `getInitialState()` function in `app.tsx`

### API requests don't include token

- Verify token is in localStorage
- Check request interceptor in `app.tsx`
- Ensure `getHeaders()` in `request.ts` is reading from localStorage

## Future Enhancements

Consider implementing:

- [ ] Remember me functionality
- [ ] Automatic token refresh before expiration
- [ ] Multi-factor authentication (MFA)
- [ ] Password reset functionality
- [ ] Session timeout warning
- [ ] Refresh token rotation
- [ ] Token revocation on logout
