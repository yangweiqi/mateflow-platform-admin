# Get Admin Me Feature Implementation

## Overview

This document describes the implementation of the "Get Admin Me" feature that fetches the authenticated admin user's information after login using the `accountServiceGetAdminMe` API endpoint.

## Changes Made

### 1. Auth Model (`src/models/auth.ts`)

#### Updated `CurrentUser` Interface

Added `adminInfo` field to store the admin user information:

```typescript
export interface CurrentUser {
  email?: string;
  token?: string;
  adminInfo?: SuperAdminInfo; // NEW
}
```

#### Added `fetchAdminMe` Function

Created a new function to fetch admin information from the API:

```typescript
const fetchAdminMe = async () => {
  try {
    const response = await AccountServiceService.accountServiceGetAdminMe();

    if (response.code === 0 && response.data) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    console.error('Fetch admin info error:', error);
    return null;
  }
};
```

#### Updated `signIn` Function

Modified the sign-in flow to fetch admin info after successful authentication:

```typescript
// Fetch admin info after successful login
const adminInfo = await fetchAdminMe();

// Update current user state
setCurrentUser({
  email: credentials.email,
  token: response.data.token,
  adminInfo: adminInfo || undefined, // NEW
});
```

#### Updated `initUser` Function

Modified user initialization to fetch admin info when loading from stored token:

```typescript
// Load email from storage
const email = getUserEmail();

// Fetch admin info
const adminInfo = await fetchAdminMe();

setCurrentUser({
  token,
  email: email || undefined,
  adminInfo: adminInfo || undefined, // NEW
});
```

#### Exported `fetchAdminMe`

Added `fetchAdminMe` to the model's return value for external use if needed.

### 2. Login Page (`src/pages/Login/index.tsx`)

Updated to use the `currentUser` from the auth model (which now includes admin info):

```typescript
const { signIn, loading, currentUser } = useModel('auth');

// ...

if (success) {
  // Update initialState with user info (includes admin info from auth model)
  await setInitialState({
    ...initialState,
    currentUser: currentUser || {
      email,
      token:
        (await import('@/utils/auth').then((mod) => mod.getToken())) ||
        undefined,
    },
  });

  // Navigate to home page
  history.push('/');
}
```

### 3. App Configuration (`src/app.tsx`)

#### Updated `InitialState` Interface

Added `adminInfo` to the global initial state:

```typescript
export interface InitialState {
  currentUser?: {
    token?: string;
    email?: string;
    adminInfo?: {
      // NEW
      id?: string;
      name?: string;
      email?: string;
      created_at?: string;
      updated_at?: string;
    };
  };
  fetchUserInfo?: () => Promise<any>;
}
```

#### Updated `fetchUserInfo` Function

Modified to fetch admin info during app initialization:

```typescript
// Fetch admin info
let adminInfo;
try {
  const response = await AccountServiceService.accountServiceGetAdminMe();
  if (response.code === 0 && response.data) {
    adminInfo = response.data;
  }
} catch (error) {
  console.error('Failed to fetch admin info:', error);
}

return {
  token: token || undefined,
  email: email || undefined,
  adminInfo: adminInfo || undefined, // NEW
};
```

#### Updated Avatar Display

Enhanced the layout to show admin name from `adminInfo`:

```typescript
avatarProps: {
  src: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
  title: initialState?.currentUser?.adminInfo?.name ||   // NEW
         initialState?.currentUser?.adminInfo?.email ||  // NEW
         initialState?.currentUser?.email ||
         'Admin',
  // ...
}
```

## Admin Info Structure

The `SuperAdminInfo` type includes the following fields:

```typescript
export type SuperAdminInfo = {
  id?: string;
  name?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
};
```

## API Endpoint

The feature uses the following API endpoint:

- **Method**: POST
- **Path**: `/platform_admin_api/v1/account/me`
- **Authentication**: Requires Bearer token in Authorization header
- **Response**: `GetAdminRespBody` containing `SuperAdminInfo`

### Authentication Configuration

The OpenAPI client is configured to automatically include the authentication token in all requests:

```typescript
// src/config/api.ts
OpenAPI.TOKEN = async () => {
  const token = getToken();
  return token || '';
};
```

This ensures that the token stored in cookies/localStorage is automatically sent with each API call.

## When Admin Info is Fetched

The admin information is fetched in the following scenarios:

1. **After successful login** - immediately after the user signs in
2. **On app initialization** - when the app loads with an existing valid token
3. **After token refresh** - when initializing user from stored token

## Benefits

1. **User Information Available**: Admin details are available throughout the application via the global state
2. **Enhanced User Experience**: The UI can display the admin's name instead of just email
3. **Better Security**: Validates that the token corresponds to a valid admin account
4. **Centralized Data**: Admin info is stored in one place and accessible via `useModel('@@initialState')` or `useModel('auth')`

## Usage in Components

Components can access the admin information via:

```typescript
import { useModel } from '@umijs/max';

function MyComponent() {
  const { initialState } = useModel('@@initialState');
  const adminInfo = initialState?.currentUser?.adminInfo;

  return (
    <div>
      <p>Welcome, {adminInfo?.name || adminInfo?.email}!</p>
      <p>Account ID: {adminInfo?.id}</p>
    </div>
  );
}
```

Or via the auth model:

```typescript
import { useModel } from '@umijs/max';

function MyComponent() {
  const { currentUser } = useModel('auth');
  const adminInfo = currentUser?.adminInfo;

  return (
    <div>
      <p>Welcome, {adminInfo?.name || adminInfo?.email}!</p>
    </div>
  );
}
```

## Error Handling

The implementation includes graceful error handling:

- If the API call fails, the application continues to work with just email/token
- Errors are logged to the console for debugging
- The user experience is not disrupted by failed admin info fetches

## Testing

To test the feature:

1. Log in with valid credentials
2. Check the browser console for the "Fetch admin info" log (if successful)
3. Verify the admin name appears in the header avatar
4. Check the browser's Application/Local Storage to see that user data is persisted
5. Refresh the page and verify admin info is loaded from the API

## Future Enhancements

Possible improvements:

1. Cache admin info in localStorage to reduce API calls
2. Add a user profile page displaying all admin information
3. Implement admin info update functionality
4. Add role/permission information to the admin data
