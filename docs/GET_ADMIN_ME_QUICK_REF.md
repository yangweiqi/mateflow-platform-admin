# Get Admin Me Feature - Quick Reference

## What Was Added

The `accountServiceGetAdminMe` API is now automatically called after login and on app initialization to fetch the authenticated admin user's complete information.

## Access Admin Info in Your Components

### Method 1: Using Global Initial State (Recommended)

```typescript
import { useModel } from '@umijs/max';

function MyComponent() {
  const { initialState } = useModel('@@initialState');
  const adminInfo = initialState?.currentUser?.adminInfo;

  return (
    <div>
      <h1>Welcome, {adminInfo?.name}!</h1>
      <p>Email: {adminInfo?.email}</p>
      <p>ID: {adminInfo?.id}</p>
      <p>Created: {adminInfo?.created_at}</p>
    </div>
  );
}
```

### Method 2: Using Auth Model

```typescript
import { useModel } from '@umijs/max';

function MyComponent() {
  const { currentUser } = useModel('auth');
  const adminInfo = currentUser?.adminInfo;

  return (
    <div>
      <h1>Welcome, {adminInfo?.name}!</h1>
    </div>
  );
}
```

## Admin Info Structure

```typescript
{
  id?: string;           // Admin user ID
  name?: string;         // Admin user name
  email?: string;        // Admin user email
  created_at?: string;   // Account creation timestamp
  updated_at?: string;   // Last update timestamp
}
```

## Manually Refresh Admin Info

```typescript
import { useModel } from '@umijs/max';

function MyComponent() {
  const { fetchAdminMe } = useModel('auth');

  const handleRefresh = async () => {
    const adminInfo = await fetchAdminMe();
    console.log('Updated admin info:', adminInfo);
  };

  return <button onClick={handleRefresh}>Refresh Profile</button>;
}
```

## When is Admin Info Fetched?

✅ **Automatically fetched:**

- After successful login
- When app initializes with existing token
- When user is reinitialized from stored token

❌ **NOT automatically fetched:**

- After token refresh (uses existing admin info)
- On every page navigation

## Check if Admin Info is Available

```typescript
const { initialState } = useModel('@@initialState');

if (initialState?.currentUser?.adminInfo) {
  // Admin info is available
  console.log('Admin:', initialState.currentUser.adminInfo.name);
} else {
  // Admin info not available (still loading or failed to fetch)
  console.log('Admin info not loaded');
}
```

## Display Fallbacks

When displaying admin info, use fallbacks for better UX:

```typescript
// Priority: name > email from adminInfo > email from currentUser
const displayName =
  initialState?.currentUser?.adminInfo?.name ||
  initialState?.currentUser?.adminInfo?.email ||
  initialState?.currentUser?.email ||
  'Admin';
```

## Example: Profile Card Component

```typescript
import { useModel } from '@umijs/max';
import { Card, Descriptions, Spin } from 'antd';

function ProfileCard() {
  const { initialState } = useModel('@@initialState');
  const adminInfo = initialState?.currentUser?.adminInfo;

  if (!adminInfo) {
    return <Spin tip="Loading profile..." />;
  }

  return (
    <Card title="Admin Profile">
      <Descriptions column={1}>
        <Descriptions.Item label="ID">{adminInfo.id}</Descriptions.Item>
        <Descriptions.Item label="Name">
          {adminInfo.name || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Email">{adminInfo.email}</Descriptions.Item>
        <Descriptions.Item label="Created">
          {new Date(adminInfo.created_at || '').toLocaleDateString()}
        </Descriptions.Item>
        <Descriptions.Item label="Last Updated">
          {new Date(adminInfo.updated_at || '').toLocaleDateString()}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default ProfileCard;
```

## TypeScript Types

Import the types if needed:

```typescript
import type { SuperAdminInfo } from '@/services/models/SuperAdminInfo';
import type { CurrentUser } from '@/models/auth';

// Use in your component
const adminInfo: SuperAdminInfo | undefined = currentUser?.adminInfo;
```

## API Endpoint Details

- **URL**: `POST /platform_admin_api/v1/account/me`
- **Auth**: Requires Bearer token in Authorization header
- **Response**: `GetAdminRespBody` with `SuperAdminInfo` data

## Troubleshooting

### Admin info is undefined

- Check if user is logged in
- Check browser console for API errors
- Verify token is valid
- Check network tab for `/account/me` request

### Admin info is outdated

- Call `fetchAdminMe()` manually to refresh
- Check if session is still valid
- Logout and login again to get fresh data

## Integration Examples

### Show admin name in header

Already implemented in `src/app.tsx`:

```typescript
avatarProps: {
  title: initialState?.currentUser?.adminInfo?.name ||
         initialState?.currentUser?.adminInfo?.email ||
         initialState?.currentUser?.email ||
         'Admin',
}
```

### Show admin info in dashboard

```typescript
function Dashboard() {
  const { initialState } = useModel('@@initialState');
  const adminInfo = initialState?.currentUser?.adminInfo;

  return (
    <div>
      <h1>Welcome back, {adminInfo?.name}!</h1>
      <p>Last login: {new Date().toLocaleString()}</p>
    </div>
  );
}
```

### Conditional rendering based on admin info

```typescript
function AdminPanel() {
  const { initialState } = useModel('@@initialState');
  const adminInfo = initialState?.currentUser?.adminInfo;

  if (!adminInfo?.id) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Admin Panel for {adminInfo.name}</h2>
      {/* Admin-specific content */}
    </div>
  );
}
```

## Files Modified

- ✅ `src/models/auth.ts` - Added fetchAdminMe, updated CurrentUser interface
- ✅ `src/pages/Login/index.tsx` - Updated to use currentUser with adminInfo
- ✅ `src/app.tsx` - Added adminInfo to InitialState, updated fetchUserInfo

## Documentation Files

- 📄 `docs/GET_ADMIN_ME_FEATURE.md` - Complete implementation details
- 📄 `docs/GET_ADMIN_ME_FLOW.md` - Flow diagrams and data flow
- 📄 `docs/GET_ADMIN_ME_QUICK_REF.md` - This quick reference
