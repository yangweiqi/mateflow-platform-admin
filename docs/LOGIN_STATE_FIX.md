# Login State Synchronization Fix

## Issue Description

After logging in, the user's name was not displayed in the top-right corner, and the Account Information page showed "N/A" for all fields (User ID, Email, Created At, Last Updated).

### Root Cause

The issue was caused by a **React state update timing problem** in the login flow:

1. The `signIn()` function in the auth model calls `setCurrentUser()` to update the state
2. The Login component tries to access `currentUser` immediately after `signIn()` returns
3. Due to React's asynchronous state updates, the Login component receives the **OLD/STALE** value of `currentUser` (which is `undefined`)
4. This stale `undefined` value is then passed to `setInitialState()`, overwriting the global state with empty data

### Code Flow Before Fix

```typescript
// In Login component
const { signIn, currentUser } = useModel('auth');

const handleSubmit = async () => {
  const success = await signIn(...credentials); // ← Returns boolean

  if (success) {
    // ❌ Problem: currentUser is STALE (still undefined from initial state)
    // because setCurrentUser() inside signIn() hasn't propagated yet
    await setInitialState({
      currentUser: currentUser || { email, token }, // ← Sets undefined or fallback
    });
  }
};
```

```typescript
// In auth model
const signIn = async (...) => {
  // ... API call ...

  const adminInfo = await fetchAdminMe();

  // This state update happens INSIDE signIn
  setCurrentUser({
    email: credentials.email,
    token: response.data.token,
    adminInfo: adminInfo || undefined,
  });

  return true;  // ← Returns boolean, not the user data
};
// When we return here, React hasn't processed the setCurrentUser() yet
```

## Solution

Changed `signIn()` to **return the user data directly** instead of a boolean, so the Login component has immediate access to the correct user information without waiting for React state propagation.

### Changes Made

#### 1. Auth Model (`src/models/auth.ts`)

**Changed return type:**

```typescript
// Before
const signIn = async (...) => {
  // ... logic ...
  return true;  // or false
};

// After
const signIn = async (
  credentials: SignInByEmailReqBody,
  rememberMe: boolean = false,
): Promise<CurrentUser | false> => {
  // ... logic ...
  return userInfo;  // or false
};
```

**Return user data instead of boolean:**

```typescript
// Before
setCurrentUser({
  email: credentials.email,
  token: response.data.data.token,
  adminInfo: adminInfo || undefined,
});
return true;

// After
const userInfo: CurrentUser = {
  email: credentials.email,
  token: response.data.data.token,
  adminInfo: adminInfo || undefined,
};

setCurrentUser(userInfo);
return userInfo; // ← Return the data directly
```

#### 2. Login Component (`src/pages/Login/index.tsx`)

**Use returned user data:**

```typescript
// Before
const { signIn, loading, currentUser } = useModel('auth');

const handleSubmit = async () => {
  const success = await signIn(...);

  if (success) {
    await setInitialState({
      currentUser: currentUser || { email, token }  // ← STALE data
    });
  }
};

// After
const { signIn, loading } = useModel('auth');  // ← Removed currentUser

const handleSubmit = async () => {
  const userInfo = await signIn(...);  // ← Get user data directly

  if (userInfo) {
    await setInitialState({
      currentUser: userInfo  // ← Use fresh data from return value
    });
  }
};
```

## Why This Works

### Before Fix - Race Condition

```
┌──────────────────────────────────────────────────────────────┐
│                      Login Flow (BROKEN)                      │
└──────────────────────────────────────────────────────────────┘

1. User clicks "Sign In"
   │
   ├─► signIn() called
   │   │
   │   ├─► API call succeeds
   │   │
   │   ├─► Fetch admin info
   │   │
   │   ├─► setCurrentUser({ ...adminInfo })  ⚠️ Async state update queued
   │   │
   │   └─► return true  ← Returns BEFORE state update processes
   │
2. Back in Login component
   │
   ├─► success = true ✅
   │
   ├─► Access currentUser variable
   │   └─► Still undefined! ❌ (State update hasn't propagated)
   │
   └─► setInitialState({ currentUser: undefined })
       └─► Overwrites global state with empty data! ❌
```

### After Fix - Direct Data Return

```
┌──────────────────────────────────────────────────────────────┐
│                      Login Flow (FIXED)                       │
└──────────────────────────────────────────────────────────────┘

1. User clicks "Sign In"
   │
   ├─► signIn() called
   │   │
   │   ├─► API call succeeds
   │   │
   │   ├─► Fetch admin info
   │   │
   │   ├─► Create userInfo object
   │   │   const userInfo = {
   │   │     email, token, adminInfo
   │   │   }
   │   │
   │   ├─► setCurrentUser(userInfo)  ⚠️ Async state update queued
   │   │
   │   └─► return userInfo  ← Returns the ACTUAL data ✅
   │
2. Back in Login component
   │
   ├─► userInfo = { email, token, adminInfo } ✅
   │
   └─► setInitialState({ currentUser: userInfo })
       └─► Global state has correct data! ✅
```

## Impact

### Fixed Components

1. **Header Avatar Display** (`src/app.tsx`)

   - Now shows actual user name instead of "Admin"
   - Shows correct user initial in avatar

2. **Settings - Account Information Tab** (`src/pages/Settings/index.tsx`)

   - User ID: Now displays actual ID
   - Email: Now displays actual email
   - Created At: Now displays actual timestamp
   - Last Updated: Now displays actual timestamp

3. **All Components Using Admin Info**
   - Any component accessing `initialState.currentUser.adminInfo` now has data

## Testing Checklist

- [x] Login with valid credentials
- [x] Check header shows user name (not "Admin")
- [x] Check Settings > Account Information shows real data (not N/A)
- [x] Check Settings > Personal Information form pre-fills correctly
- [x] Verify auth model's `currentUser` state is updated
- [x] Verify global `initialState.currentUser` has admin info
- [x] No linting errors

## Technical Explanation

### React State Update Behavior

React's `useState` updates are **asynchronous**. When you call `setState()`, the new value is not immediately available in the current execution context:

```typescript
const [count, setCount] = useState(0);

setCount(5);
console.log(count); // Still 0! Not 5 yet.
// The update happens after the current function completes
```

### Previous Pattern (Problematic)

```typescript
// In auth model
const signIn = async () => {
  setCurrentUser(newData); // Queues update
  return true; // Returns immediately
};

// In Login component
const { currentUser } = useModel('auth'); // Gets current value
await signIn(); // Updates state internally
// currentUser is STILL the old value here!
```

### New Pattern (Correct)

```typescript
// In auth model
const signIn = async () => {
  const userData = {
    /* ... */
  };
  setCurrentUser(userData); // Queues update
  return userData; // Returns the data directly
};

// In Login component
const userInfo = await signIn(); // Gets the data from return value
// userInfo has the correct data immediately!
```

## Additional Notes

### State Consistency

After this fix, there are **two independent updates**:

1. **Auth Model State**: Updated by `setCurrentUser()` (asynchronous)
2. **Global State**: Updated by `setInitialState()` (asynchronous)

Both receive the same `userInfo` object, ensuring consistency.

### Why Keep Both Updates?

- **Auth Model State**: Used by auth model's own logic (token refresh, etc.)
- **Global State**: Used by layout, Settings page, and other global components

Both are necessary and serve different purposes in the application architecture.

## Related Files

- `src/models/auth.ts` - Auth state management
- `src/pages/Login/index.tsx` - Login page component
- `src/app.tsx` - Global layout and initial state
- `src/pages/Settings/index.tsx` - Settings page (displays admin info)

## Related Documentation

- [CURRENTUSER_STATE_UPDATE.md](./CURRENTUSER_STATE_UPDATE.md) - State update enhancement
- [CURRENTUSER_STATE_SYNC_FLOW.md](./CURRENTUSER_STATE_SYNC_FLOW.md) - State sync flows
- [GET_ADMIN_ME_FEATURE.md](./GET_ADMIN_ME_FEATURE.md) - Admin info fetching
