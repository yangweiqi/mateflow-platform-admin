# Current User State Synchronization Flow

## Overview

This document illustrates how the `currentUser` state is synchronized between the auth model and global initialState after fetching admin info.

## State Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application State                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐         ┌─────────────────────────┐
│   Auth Model State      │         │  Global Initial State   │
│   (useModel('auth'))    │         │  (@@initialState)       │
├─────────────────────────┤         ├─────────────────────────┤
│ currentUser: {          │         │ currentUser: {          │
│   email: string         │◄───────►│   email: string         │
│   token: string         │  SYNC   │   token: string         │
│   adminInfo: {...}      │         │   adminInfo: {...}      │
│ }                       │         │ }                       │
└─────────────────────────┘         └─────────────────────────┘
         ▲                                     ▲
         │                                     │
         └─────────── Components ──────────────┘
```

## Flow Diagrams

### 1. Login Flow (Automatic Sync)

```
┌────────────────────────────────────────────────────────────────┐
│                         Login Flow                              │
└────────────────────────────────────────────────────────────────┘

User enters credentials
         │
         ▼
┌─────────────────────┐
│   signIn()          │
│   (auth model)      │
└──────────┬──────────┘
           │
           ├─► Call API: POST /sign-in
           │   └─► Get access token
           │
           ├─► Store token in storage
           │
           ├─► Call: fetchAdminMe()
           │   │
           │   └─► Call API: GET /account/me
           │       └─► Get admin info
           │
           ├─► Update AUTH MODEL state
           │   setCurrentUser({
           │     email: "...",
           │     token: "...",
           │     adminInfo: {...} ✅
           │   })
           │
           └─► Login Page updates GLOBAL state
               setInitialState({
                 currentUser: currentUser ✅
               })

Result: Both states synchronized ✅
```

### 2. Profile Update Flow (Manual Sync)

```
┌────────────────────────────────────────────────────────────────┐
│                    Profile Update Flow                          │
└────────────────────────────────────────────────────────────────┘

User updates profile in Settings
         │
         ▼
┌─────────────────────────────────┐
│  accountServiceUpdateProfile()  │
└──────────────┬──────────────────┘
               │
               ├─► Call API: POST /account/update
               │   └─► Success
               │
               ├─► Call: fetchAdminMe(true) ⭐ NEW
               │   │
               │   ├─► Call API: GET /account/me
               │   │   └─► Get updated admin info
               │   │
               │   └─► Update AUTH MODEL state
               │       setCurrentUser(prev => ({
               │         ...prev,
               │         adminInfo: {...} ✅
               │       }))
               │
               └─► Update GLOBAL state
                   setInitialState({
                     ...initialState,
                     currentUser: {
                       ...currentUser,
                       adminInfo: {...} ✅
                     }
                   })

Result: Both states synchronized ✅
```

### 3. App Initialization Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   App Initialization Flow                       │
└────────────────────────────────────────────────────────────────┘

App loads
   │
   ▼
┌─────────────────────┐
│  getInitialState()  │
│  (app.tsx)          │
└──────────┬──────────┘
           │
           ├─► Check if authenticated
           │   └─► Token exists in storage
           │
           ├─► Call API: GET /account/me
           │   └─► Get admin info
           │
           └─► Set GLOBAL state
               return {
                 currentUser: {
                   token: "...",
                   email: "...",
                   adminInfo: {...} ✅
                 }
               }

Later, when auth model initializes:
   │
   ▼
┌─────────────────────┐
│   initUser()        │
│   (auth model)      │
└──────────┬──────────┘
           │
           ├─► Get token from storage
           │
           ├─► Call: fetchAdminMe()
           │   └─► Get admin info
           │
           └─► Update AUTH MODEL state
               setCurrentUser({
                 token: "...",
                 email: "...",
                 adminInfo: {...} ✅
               })

Result: Both states synchronized ✅
```

### 4. State Update Comparison

#### Before Enhancement ❌

```
Settings Page: Profile Update
         │
         ▼
┌──────────────────────────┐
│ accountServiceUpdate()   │
└───────────┬──────────────┘
            │
            └─► fetchUserInfo()
                    │
                    ├─► Fetch admin info
                    │
                    └─► Update GLOBAL state ✅

                        AUTH MODEL state ❌ (NOT UPDATED)

Result: Inconsistent states ❌
```

#### After Enhancement ✅

```
Settings Page: Profile Update
         │
         ▼
┌──────────────────────────┐
│ accountServiceUpdate()   │
└───────────┬──────────────┘
            │
            ├─► fetchAdminMe(true)
            │       │
            │       ├─► Fetch admin info
            │       │
            │       └─► Update AUTH MODEL state ✅
            │
            └─► setInitialState()
                    │
                    └─► Update GLOBAL state ✅

Result: Both states synchronized ✅
```

## Component Access Patterns

### Pattern 1: Access via Auth Model

```typescript
import { useModel } from '@umijs/max';

function MyComponent() {
  const { currentUser } = useModel('auth');

  return (
    <div>
      <h1>Welcome, {currentUser?.adminInfo?.name}!</h1>
      <p>Email: {currentUser?.adminInfo?.email}</p>
    </div>
  );
}

// ✅ After fetchAdminMe(true), immediately shows updated data
```

### Pattern 2: Access via Global State

```typescript
import { useModel } from '@umijs/max';

function MyComponent() {
  const { initialState } = useModel('@@initialState');
  const adminInfo = initialState?.currentUser?.adminInfo;

  return (
    <div>
      <h1>Welcome, {adminInfo?.name}!</h1>
      <p>Email: {adminInfo?.email}</p>
    </div>
  );
}

// ✅ After setInitialState(), immediately shows updated data
```

### Pattern 3: Using Both (Settings Page)

```typescript
import { useModel } from '@umijs/max';

function Settings() {
  const { fetchAdminMe } = useModel('auth');
  const { initialState, setInitialState } = useModel('@@initialState');

  const updateProfile = async () => {
    // Update profile via API...

    // Sync both states
    const updatedInfo = await fetchAdminMe(true); // ✅ Auth model

    if (updatedInfo) {
      setInitialState({
        // ✅ Global state
        ...initialState,
        currentUser: {
          ...initialState?.currentUser,
          adminInfo: updatedInfo,
        },
      });
    }
  };

  // ✅ Both patterns see updated data
}
```

## State Update Decision Tree

```
Need to fetch admin info?
         │
         ├─── During login? ────────────► Use signIn() (handles state)
         │
         ├─── During init? ─────────────► Use initUser() (handles state)
         │
         └─── Manual refresh? ──────────► Use fetchAdminMe(true) + setInitialState()
                                           ├─► Updates auth model
                                           └─► Updates global state
```

## Key Takeaways

1. **Two State Sources**: Auth model and global initialState
2. **Need Synchronization**: After manual updates
3. **fetchAdminMe(true)**: Updates auth model state
4. **setInitialState()**: Updates global state
5. **Both Required**: For complete synchronization
6. **Automatic in Some Flows**: Login and init handle it
7. **Manual in Others**: Profile updates need explicit sync

## Best Practices

✅ **DO:**

- Use `fetchAdminMe(true)` when manually refreshing
- Update both states for consistency
- Let login/init flows manage their own state

❌ **DON'T:**

- Update only one state source
- Call `fetchAdminMe(true)` during login (handled automatically)
- Assume states auto-sync without explicit code

## Related Documentation

- [CURRENTUSER_STATE_UPDATE.md](./CURRENTUSER_STATE_UPDATE.md) - Detailed implementation
- [GET_ADMIN_ME_QUICK_REF.md](./GET_ADMIN_ME_QUICK_REF.md) - Quick reference
- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) - Auth system overview
