# Backend Integration Guide

## Overview

This document explains how the authentication system has been adapted to work with your backend's token refresh mechanism.

## 🔄 Token Refresh Strategy

### Your Backend Approach

Your backend **does NOT use separate refresh tokens**. Instead:

- ✅ Single access token is issued on login
- ✅ Refresh endpoint accepts the **current access token** in the Authorization header
- ✅ Refresh endpoint validates the current token and issues a **new access token**
- ✅ No separate refresh token needed

### How Our Implementation Works

The frontend has been updated to match this approach:

```typescript
// Token refresh using current access token
const refreshToken = async () => {
  try {
    // Call refresh endpoint with current token in Authorization header
    const response = await AccountServiceService.accountServiceRefreshToken();

    if (response.code === 0 && response.data?.token) {
      // Store the new access token
      setToken(response.data.token, response.data.expires_at);
      return response.data.token;
    }
    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
};
```

## 📋 Required Backend Endpoints

### 1. Login Endpoint

```
POST /platform_admin_api/v1/account/sign_in_by_email

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "code": 0,
  "msg": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-10-29T13:00:00Z"  // Optional but recommended
}
```

**Requirements:**

- Return JWT access token on successful authentication
- Optionally return expiration time (ISO 8601 format)
- Token should have reasonable expiration (e.g., 1-24 hours)

---

### 2. Refresh Token Endpoint

```
POST /platform_admin_api/v1/account/refresh_token

Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Request Body: None

Response:
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-10-29T14:00:00Z"  // Optional but recommended
  }
}
```

**Requirements:**

- Accept current access token in Authorization header
- Validate the current token
- Issue a new access token if current token is valid
- Return new token with expiration time
- Old token can remain valid until its natural expiration

**Important:**

- The endpoint must accept **Bearer token authentication**
- The token validation should check:
  - Token signature is valid
  - Token has not expired (or is within grace period)
  - Token has not been revoked/blacklisted

---

### 3. Logout Endpoint

```
POST /platform_admin_api/v1/account/sign_out

Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Request Body: None

Response:
{
  "code": 0,
  "msg": "success"
}
```

**Requirements:**

- Accept current access token in Authorization header
- Invalidate/blacklist the token (recommended)
- Return success response

**Recommended Server Actions:**

- Add token to blacklist/revocation list
- Store token ID in Redis with TTL matching token expiration
- Check blacklist on all protected endpoints
- Clean up expired tokens from blacklist periodically

---

## 🔧 How It Works

### Login Flow

```
1. User enters credentials
      ↓
2. POST /sign_in_by_email
      ↓
3. Backend validates credentials
      ↓
4. Backend generates JWT access token
      ↓
5. Backend returns token + expiration
      ↓
6. Frontend stores token in localStorage
      ↓
7. Frontend starts auto-refresh timer
```

### Automatic Token Refresh Flow

```
1. Timer checks every 60 seconds
      ↓
2. Is token expiring in < 10 minutes?
      ↓
3. YES → Call refresh endpoint
      ↓
4. POST /refresh_token with current token
      ↓
5. Backend validates current token
      ↓
6. Backend generates new JWT token
      ↓
7. Backend returns new token + expiration
      ↓
8. Frontend stores new token
      ↓
9. Process repeats while user is active
```

### Token Usage in API Calls

```
Every API Request:
      ↓
1. Get token from localStorage
      ↓
2. Add to Authorization header
      ↓
3. POST/GET/PUT/DELETE /api/endpoint
   Headers: Authorization: Bearer <token>
      ↓
4. Backend validates token
      ↓
5. Backend processes request
      ↓
6. Response returned
```

### Logout Flow

```
1. User clicks logout
      ↓
2. POST /sign_out with token
      ↓
3. Backend invalidates token
      ↓
4. Frontend clears localStorage
      ↓
5. Frontend stops timers
      ↓
6. Redirect to login page
```

---

## 🔐 Security Considerations

### Backend Token Validation

Your backend should validate tokens on **every protected endpoint**:

```python
# Pseudo-code example
def validate_token(token):
    # 1. Verify JWT signature
    if not verify_signature(token):
        return False

    # 2. Check expiration
    if token.expires_at < now():
        return False

    # 3. Check if token is blacklisted (after logout)
    if is_blacklisted(token.jti):
        return False

    return True
```

### Token Blacklist/Revocation

Implement token revocation for logout:

```python
# Pseudo-code example
def logout(token):
    # Extract token ID (jti claim)
    token_id = extract_jti(token)

    # Add to blacklist with TTL
    redis.setex(
        key=f"blacklist:{token_id}",
        value="1",
        ttl=token.expires_at - now()
    )

    return {"code": 0, "msg": "success"}

def is_blacklisted(token_id):
    return redis.exists(f"blacklist:{token_id}")
```

### Token Refresh Security

**Grace Period for Refresh:**

- Allow token refresh slightly after expiration (e.g., 5-minute grace)
- This prevents race conditions where token expires during refresh

**Rate Limiting:**

- Limit refresh endpoint to prevent abuse
- E.g., max 10 requests per minute per token

**Token TTL:**

- Access tokens: 1-24 hours (recommended: 1-2 hours)
- Refresh endpoint accepts tokens within grace period

---

## 💾 Storage Strategy

### Frontend Storage (Current Implementation)

```typescript
// localStorage keys used:
const TOKEN_KEY = 'admin_token'; // Access token
const TOKEN_EXPIRES_KEY = 'admin_token_expires'; // Expiration time
const REMEMBER_ME_KEY = 'admin_remember_me'; // Remember me flag
const SESSION_START_KEY = 'admin_session_start'; // Session start time
```

### What's NOT Stored

- ❌ No separate refresh token (not needed with your backend)
- ❌ No refresh token expiration (not applicable)
- ❌ No user profile data (can be added if needed)

---

## 🎯 Remember Me Implementation

### How It Works (Without Separate Refresh Token)

"Remember Me" is implemented through continuous token refresh:

1. **User checks "Remember me" on login**

   - Sets `admin_remember_me` flag to `true`
   - Starts auto-refresh timer

2. **Auto-refresh keeps session alive**

   - Checks every 60 seconds
   - Refreshes token 10 minutes before expiration
   - Uses current token to get new token

3. **Session continues as long as:**

   - User keeps app open/active OR
   - User returns within token expiration time

4. **Session ends when:**
   - User explicitly logs out OR
   - User is inactive beyond token expiration OR
   - Token refresh fails (invalid/revoked token)

### Important Note

With this approach, "Remember Me" works differently than traditional implementations:

- ✅ **Pro**: More secure (no long-lived refresh tokens to steal)
- ⚠️ **Limitation**: Requires app to be active periodically for refresh
- ⚠️ **Limitation**: If user closes app and token expires, must login again

**Recommendation for True "Remember Me":** If you want users to stay logged in for 30 days even when app is closed, consider:

- Implementing separate refresh tokens on backend
- Setting refresh token TTL to 30 days
- Rotating refresh tokens on each use

---

## 🧪 Testing Your Backend Integration

### Test 1: Login

```bash
curl -X POST http://your-api/platform_admin_api/v1/account/sign_in_by_email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Expected Response:
{
  "code": 0,
  "msg": "success",
  "token": "eyJhbGci...",
  "expires_at": "2025-10-29T13:00:00Z"
}
```

### Test 2: Refresh Token

```bash
curl -X POST http://your-api/platform_admin_api/v1/account/refresh_token \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json"

# Expected Response:
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGci...",
    "expires_at": "2025-10-29T14:00:00Z"
  }
}
```

### Test 3: Protected Endpoint

```bash
curl -X GET http://your-api/platform_admin_api/v1/some_protected_endpoint \
  -H "Authorization: Bearer eyJhbGci..."

# Expected: Normal response (200) if token valid
# Expected: 401 Unauthorized if token invalid/expired
```

### Test 4: Logout

```bash
curl -X POST http://your-api/platform_admin_api/v1/account/sign_out \
  -H "Authorization: Bearer eyJhbGci..."

# Expected Response:
{
  "code": 0,
  "msg": "success"
}

# After logout, the token should be revoked:
curl -X GET http://your-api/platform_admin_api/v1/some_protected_endpoint \
  -H "Authorization: Bearer eyJhbGci..."

# Expected: 401 Unauthorized (token is revoked)
```

---

## 🔧 Configuration

### Frontend Configuration

Adjust timing in `src/models/auth.ts`:

```typescript
// Maximum session duration (30 minutes)
const MAX_SESSION_DURATION = 30 * 60 * 1000;

// Token refresh check interval (1 minute)
const TOKEN_REFRESH_CHECK_INTERVAL = 60 * 1000;
```

Adjust token refresh buffer in `src/utils/auth.ts`:

```typescript
// Refresh token 10 minutes before expiration
const refreshBuffer = 10 * 60 * 1000;
```

### Backend Configuration

Recommended JWT token settings:

```python
# Access token expiration
ACCESS_TOKEN_EXPIRE_MINUTES = 120  # 2 hours

# Refresh grace period (allow refresh slightly after expiration)
REFRESH_GRACE_PERIOD_MINUTES = 5

# Token algorithm
ALGORITHM = "HS256"  # or RS256 for higher security

# Include expiration in JWT claims
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4())  # Unique token ID for revocation
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire.isoformat()
```

---

## 📊 Comparison: Before vs After Adjustment

### Before (Assuming Separate Refresh Tokens)

```
Login → Get access_token + refresh_token
         ↓
Use access_token for API calls
         ↓
Access token expires
         ↓
Use refresh_token to get new access_token
         ↓
Problem: Backend doesn't support separate refresh_token ❌
```

### After (Using Current Token for Refresh)

```
Login → Get access_token
         ↓
Use access_token for API calls
         ↓
Token nearing expiration (10 min before)
         ↓
Use current access_token to get new access_token
         ↓
Works perfectly with your backend! ✅
```

---

## ✅ Summary

### What Changed

1. **Removed**: Separate refresh token storage and management
2. **Updated**: Token refresh to use current access token
3. **Updated**: Remember Me to work with continuous token refresh
4. **Updated**: Documentation to reflect new approach

### What Stayed the Same

1. ✅ Automatic token refresh (still every 60 seconds check)
2. ✅ Session timeout warning (still 5 minutes before timeout)
3. ✅ Token revocation on logout (still calls server)
4. ✅ All UI components and user experience

### Backend Requirements

Your backend must provide:

1. ✅ Login endpoint returning JWT token
2. ✅ Refresh endpoint accepting current token, returning new token
3. ✅ Logout endpoint for token revocation
4. ✅ Token validation on all protected endpoints

---

## 🍪 Cookie Storage (Enhanced Security)

### Current Implementation

The system now supports **secure cookie storage** for tokens:

- ✅ Automatic cookie usage if available
- ✅ Fallback to localStorage if cookies disabled
- ✅ Secure flag (HTTPS only)
- ✅ SameSite=Strict (CSRF protection)
- ✅ Automatic expiration

### For Maximum Security: Backend httpOnly Cookies

**Recommended for production:** Have your backend set httpOnly cookies instead of returning tokens in the response body.

**Backend changes needed:**

```python
# Login endpoint
def login(response: Response):
    token = create_access_token(...)

    # Set httpOnly cookie with name 'jwt' (required by frontend)
    response.set_cookie(
        key="jwt",          # ✅ Cookie name must be 'jwt'
        value=token,
        max_age=3600,
        httponly=True,      # ✅ Maximum security
        secure=True,
        samesite="strict",
        path="/"
    )

    # Don't return token in body
    return {"code": 0, "msg": "success"}

# Refresh endpoint
def refresh_token(request: Request, response: Response):
    # Get token from cookie named 'jwt'
    current_token = request.cookies.get("jwt")

    # Validate and create new token
    new_token = create_new_token(...)

    # Set new cookie with name 'jwt'
    response.set_cookie(
        key="jwt",          # ✅ Cookie name must be 'jwt'
        value=new_token,
        max_age=3600,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )

    return {"code": 0, "data": {"msg": "success"}}

# Logout endpoint
def logout(response: Response):
    # Clear cookie named 'jwt'
    response.delete_cookie(key="jwt", path="/")
    return {"code": 0, "msg": "success"}
```

**Frontend changes:** None needed! Cookies are sent automatically with requests.

See `docs/COOKIE_STORAGE_GUIDE.md` for complete details.

---

## 🎉 Ready to Go!

The authentication system has been successfully adapted to work with your backend's token refresh mechanism. No separate refresh tokens needed!

**Next Steps:**

1. Ensure your backend implements the required endpoints
2. Test the integration using the test cases above
3. Configure token expiration times as needed
4. (Optional) Implement backend httpOnly cookies for maximum security
5. Deploy and monitor

For questions about specific features, see:

- `docs/COOKIE_STORAGE_GUIDE.md` - Cookie storage implementation
- `docs/ADVANCED_AUTH_FEATURES.md` - Complete technical guide
- `docs/ADVANCED_FEATURES_QUICKSTART.md` - Quick start guide
