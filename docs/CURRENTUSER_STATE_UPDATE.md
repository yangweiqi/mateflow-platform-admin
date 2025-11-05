# Current User State Update Enhancement

## Overview

This document describes the enhancement to ensure that the `currentUser` state in the auth model is properly updated whenever admin information is fetched from the API (`/platform_admin_api/v1/account/me`).

## Problem Statement

Previously, when `fetchAdminMe()` was called manually (e.g., after updating profile in Settings page), it would only return the admin info data but **would not update** the `currentUser` state in the auth model. This caused inconsistency between:

1. The global `initialState.currentUser.adminInfo` (updated)
2. The auth model's `currentUser.adminInfo` (not updated)

This meant that components using `useModel('auth')` would have stale data until the page was refreshed or the user logged out and back in.

## Solution

### 1. Enhanced `fetchAdminMe` Function

**File:** `src/models/auth.ts`

Added an optional parameter `updateState` to the `fetchAdminMe` function:

```typescript
/**
 * Fetch current admin user information
 * @param updateState - Whether to update the currentUser state (default: false for backward compatibility)
 */
const fetchAdminMe = async (updateState: boolean = false) => {
  try {
    const response = await accountServiceGetAdminMe();

    if (response.data?.code === 0 && response.data?.data) {
      const adminInfo = response.data.data;

      // Update currentUser state if requested
      if (updateState) {
        setCurrentUser((prev) => ({
          ...prev,
          adminInfo,
        }));
      }

      return adminInfo;
    }
    return null;
  } catch (error: any) {
    console.error('Fetch admin info error:', error);
    return null;
  }
};
```

**Key Changes:**

- Added `updateState` parameter (default: `false` for backward compatibility)
- When `updateState` is `true`, the function updates the auth model's `currentUser` state
- Returns the fetched admin info for use in other contexts

**Why default to `false`?**

- Maintains backward compatibility with existing flows (login, initUser) that manage state updates themselves
- Prevents double state updates in existing code paths

### 2. Updated Settings Page

**File:** `src/pages/Settings/index.tsx`

Modified the profile update handler to update both the auth model and global state:

```typescript
// Get fetchAdminMe from auth model
const { fetchAdminMe } = useModel('auth');

// In handleProfileUpdate function:
if (response.data?.code === 0) {
  message.success('Profile updated successfully');

  // Fetch updated admin info and update both auth model and global state
  const updatedAdminInfo = await fetchAdminMe(true); // true = update auth model state

  // Also update global initial state
  if (updatedAdminInfo) {
    setInitialState({
      ...initialState,
      currentUser: {
        ...initialState?.currentUser,
        adminInfo: updatedAdminInfo,
      },
    });
  }
}
```

**Key Changes:**

- Import `fetchAdminMe` from the auth model
- Call `fetchAdminMe(true)` to update the auth model's state
- Also update the global `initialState` for consistency

## When to Use `updateState: true`

Use `fetchAdminMe(true)` when:

✅ **Manually refreshing admin info** (e.g., after profile update, manual refresh button) ✅ **External updates** where you need to sync both the auth model and global state ✅ **Any scenario** where components using `useModel('auth')` need the latest data

Use `fetchAdminMe()` (default `false`) when:

✅ **During login flow** - state is managed by `signIn()` function ✅ **During initialization** - state is managed by `initUser()` function ✅ **When you only need the data** and will manage state updates separately

## State Synchronization Flow

### Before Enhancement

```
1. User updates profile in Settings
   │
   ├─► API call: accountServiceUpdateProfile()
   │   └─► Success
   │
   ├─► Call: initialState.fetchUserInfo()
   │   │
   │   ├─► Fetch admin info from API
   │   │
   │   └─► Update global initialState
   │       ✅ initialState.currentUser.adminInfo = new data
   │
   └─► Auth model state NOT updated
       ❌ authModel.currentUser.adminInfo = old data
```

### After Enhancement

```
1. User updates profile in Settings
   │
   ├─► API call: accountServiceUpdateProfile()
   │   └─► Success
   │
   ├─► Call: fetchAdminMe(true)
   │   │
   │   ├─► Fetch admin info from API
   │   │
   │   └─► Update auth model state
   │       ✅ authModel.currentUser.adminInfo = new data
   │
   └─► Update global initialState
       ✅ initialState.currentUser.adminInfo = new data
```

## Affected Components

### Components Now Properly Updated

Any component using the auth model will now see updated admin info immediately:

```typescript
import { useModel } from '@umijs/max';

function MyComponent() {
  const { currentUser } = useModel('auth');
  const adminInfo = currentUser?.adminInfo;

  // ✅ Now always shows latest admin info after profile update
  return <div>Welcome, {adminInfo?.name}!</div>;
}
```

### Components Already Working

Components using global initial state continue to work as before:

```typescript
import { useModel } from '@umijs/max';

function MyComponent() {
  const { initialState } = useModel('@@initialState');
  const adminInfo = initialState?.currentUser?.adminInfo;

  // ✅ Already worked, continues to work
  return <div>Welcome, {adminInfo?.name}!</div>;
}
```

## Testing Checklist

- [x] Login flow - admin info fetched and both states updated
- [x] App initialization - admin info fetched and both states updated
- [x] Profile update in Settings - admin info refreshed and both states updated
- [x] Token refresh - auth state preserved (no state reset)
- [x] Logout - all states cleared properly
- [x] Components using `useModel('auth')` display updated info
- [x] Components using `useModel('@@initialState')` display updated info

## Files Modified

1. ✅ `src/models/auth.ts`

   - Enhanced `fetchAdminMe()` with optional `updateState` parameter
   - Added state update logic when `updateState` is `true`

2. ✅ `src/pages/Settings/index.tsx`
   - Import `fetchAdminMe` from auth model
   - Call `fetchAdminMe(true)` after profile update
   - Update both auth model and global state

## Benefits

1. **State Consistency**: Both auth model and global state stay synchronized
2. **Real-time Updates**: Components using either state source see updates immediately
3. **Backward Compatible**: Existing code continues to work without changes
4. **Flexible**: Developers can choose when to update state with the `updateState` parameter
5. **Clear Intent**: Parameter name makes it explicit when state updates happen

## Usage Examples

### Example 1: Refresh Profile Button

```typescript
import { useModel } from '@umijs/max';

function ProfilePage() {
  const { fetchAdminMe, currentUser } = useModel('auth');
  const { initialState, setInitialState } = useModel('@@initialState');

  const handleRefresh = async () => {
    // Fetch and update both states
    const updatedInfo = await fetchAdminMe(true);

    if (updatedInfo) {
      setInitialState({
        ...initialState,
        currentUser: {
          ...initialState?.currentUser,
          adminInfo: updatedInfo,
        },
      });
      message.success('Profile refreshed!');
    }
  };

  return (
    <div>
      <h1>{currentUser?.adminInfo?.name}</h1>
      <Button onClick={handleRefresh}>Refresh</Button>
    </div>
  );
}
```

### Example 2: Read-only Data Fetch

```typescript
import { useModel } from '@umijs/max';

function AdminInfoDisplay() {
  const { fetchAdminMe } = useModel('auth');

  const logAdminInfo = async () => {
    // Just fetch data, don't update state
    const info = await fetchAdminMe();
    console.log('Admin info:', info);
  };

  return <Button onClick={logAdminInfo}>Log Info</Button>;
}
```

## Migration Guide

If you have existing code that manually calls `fetchAdminMe()`, no changes are required. The function works as before by default.

If you want to enable automatic state updates, simply add `true` as a parameter:

```typescript
// Before (still works)
const adminInfo = await fetchAdminMe();

// After (with state update)
const adminInfo = await fetchAdminMe(true);
```

## Related Documentation

- [GET_ADMIN_ME_FEATURE.md](./GET_ADMIN_ME_FEATURE.md) - Original implementation
- [GET_ADMIN_ME_QUICK_REF.md](./GET_ADMIN_ME_QUICK_REF.md) - Quick reference guide
- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) - Auth system architecture
