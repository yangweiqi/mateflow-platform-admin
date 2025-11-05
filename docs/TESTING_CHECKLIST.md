# Authentication Testing Checklist

Use this comprehensive checklist to verify that all authentication features are working correctly.

## 🚀 Pre-Testing Setup

- [ ] Install dependencies: `npm install` or `pnpm install`
- [ ] Start dev server: `npm run dev` or `pnpm dev`
- [ ] Open browser to `http://localhost:8000`
- [ ] Open browser DevTools (F12)
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Have valid test credentials ready

## 1️⃣ Login Page Tests

### Page Access

- [ ] Navigate to root `/` - should redirect to `/login`
- [ ] Login page loads without errors
- [ ] Login page has no layout (header/sidebar)
- [ ] Login page displays properly on desktop
- [ ] Login page displays properly on mobile (responsive)

### UI Elements

- [ ] Logo displays correctly
- [ ] Page title "Platform Admin" is visible
- [ ] Subtitle "Sign in to your account" is visible
- [ ] Email input field is present
- [ ] Password input field is present
- [ ] Sign In button is present
- [ ] Gradient background displays correctly

### Form Validation

- [ ] Submit empty form - shows "Please input your email!" error
- [ ] Enter invalid email (e.g., "test") - shows "Please enter a valid email!" error
- [ ] Enter valid email but no password - shows "Please input your password!" error
- [ ] Enter password < 6 chars - shows "Password must be at least 6 characters!" error
- [ ] Enter valid email + valid password - form submits

### Login Process

- [ ] Click submit with wrong credentials - shows error message
- [ ] Error message is clear and understandable
- [ ] Submit button shows loading state during login
- [ ] Form fields are disabled during loading
- [ ] Login with correct credentials - succeeds
- [ ] Success message appears
- [ ] Token is stored in localStorage (check: `localStorage.getItem('admin_token')`)
- [ ] Redirects to home page after successful login

## 2️⃣ Authentication State Tests

### localStorage

- [ ] `admin_token` key exists in localStorage
- [ ] Token value is a non-empty string
- [ ] Token looks like a JWT (has dots, e.g., `eyJ...`)
- [ ] `admin_token_expires` key exists (if API provides it)

### Initial State

- [ ] Open DevTools Console
- [ ] Check initialState: `window.g_initialState`
- [ ] `currentUser` object exists
- [ ] `currentUser.token` matches localStorage token
- [ ] No console errors during initialization

## 3️⃣ Home Page Tests

### Page Access

- [ ] Home page loads successfully after login
- [ ] Page has layout (header, sidebar)
- [ ] No infinite redirect loops

### UI Elements

- [ ] "Welcome to Platform Admin!" alert is visible
- [ ] Alert is green (success type)
- [ ] Authentication Status card displays
- [ ] Status shows "Authenticated ✅"
- [ ] "Token Present" shows "Yes"
- [ ] Email displays (or "N/A" if not available)

### Header Elements

- [ ] App logo displays in header
- [ ] "Platform Admin" title displays
- [ ] User avatar displays in top-right
- [ ] Logout icon (🔓) displays in top-right
- [ ] Hover over logout icon shows pointer cursor

## 4️⃣ Protected Routes Tests

### Route Access (While Logged In)

- [ ] Navigate to `/home` - accessible
- [ ] Navigate to `/access` - accessible
- [ ] Navigate to `/table` - accessible
- [ ] All pages load without redirect to login

### Route Access (While Logged Out)

- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Refresh page
- [ ] Should redirect to `/login`
- [ ] Try accessing `/home` directly - redirects to `/login`
- [ ] Try accessing `/access` directly - redirects to `/login`
- [ ] Try accessing `/table` directly - redirects to `/login`

## 5️⃣ Logout Tests

### Logout Process

- [ ] Login successfully
- [ ] Navigate to home page
- [ ] Click logout icon in header
- [ ] Logout API is called (check Network tab)
- [ ] Success message "Logged out successfully" appears
- [ ] Token is removed from localStorage
- [ ] `localStorage.getItem('admin_token')` returns null
- [ ] Redirected to `/login` page
- [ ] Cannot access protected routes anymore

### Post-Logout State

- [ ] Refresh the page on `/login`
- [ ] Should stay on login page (not auto-login)
- [ ] Try accessing `/home` - redirects to `/login`
- [ ] Login page still works correctly

## 6️⃣ HTTP Request Tests

### Token Injection

- [ ] Login successfully
- [ ] Open browser DevTools → Network tab
- [ ] Clear network log
- [ ] Navigate to a page that makes API calls
- [ ] Click on an API request in Network tab
- [ ] Go to "Headers" section
- [ ] Check "Request Headers"
- [ ] `Authorization` header exists
- [ ] Header value is `Bearer <token>`
- [ ] Token matches the one in localStorage

### API Service Calls

- [ ] Open browser DevTools Console
- [ ] Import service: Copy this to console
  ```javascript
  // This will be available after login
  console.log(localStorage.getItem('admin_token'));
  ```
- [ ] Make a test API call (if you have a safe endpoint)
- [ ] Verify Authorization header is included
- [ ] Request succeeds (no 401 error)

## 7️⃣ Error Handling Tests

### 401 Unauthorized

- [ ] Login successfully
- [ ] Open DevTools Console
- [ ] Manually clear token: `localStorage.removeItem('admin_token')`
- [ ] Make an API call (navigate to different page)
- [ ] Should receive 401 error
- [ ] Error message "Session expired, please login again" appears
- [ ] Automatically redirected to `/login`
- [ ] localStorage is cleared

### Network Errors

- [ ] Disable network (DevTools → Network → Offline)
- [ ] Try to login
- [ ] Appropriate error message displays
- [ ] Re-enable network
- [ ] Login works again

### Invalid Credentials

- [ ] Enter wrong email/password
- [ ] Submit form
- [ ] Error message displays
- [ ] Message explains the error
- [ ] Can try again with different credentials

## 8️⃣ Token Expiration Tests

### Manual Expiration Test

- [ ] Login successfully
- [ ] Open DevTools Console
- [ ] Set expiration to past date:
  ```javascript
  localStorage.setItem('admin_token_expires', '2020-01-01T00:00:00Z');
  ```
- [ ] Refresh the page
- [ ] Should redirect to `/login`
- [ ] Token is considered expired

### Token Refresh (if implemented)

- [ ] Login successfully
- [ ] Wait for token to be near expiration
- [ ] Token should refresh automatically
- [ ] Check localStorage for new token
- [ ] Session continues without interruption

## 9️⃣ Browser Compatibility Tests

### Modern Browsers

- [ ] Chrome/Edge - all features work
- [ ] Firefox - all features work
- [ ] Safari - all features work
- [ ] Mobile Chrome - all features work
- [ ] Mobile Safari - all features work

### localStorage Support

- [ ] Private/Incognito mode - works correctly
- [ ] localStorage is available
- [ ] No errors in console

## 🔟 Security Tests

### XSS Protection

- [ ] Enter `<script>alert('xss')</script>` in email field
- [ ] Submit form
- [ ] Script should NOT execute
- [ ] Input is properly sanitized

### Token Security

- [ ] Token is stored in localStorage (visible but acceptable for SPA)
- [ ] Token is not visible in URL
- [ ] Token is not logged to console (except in dev mode)
- [ ] Token is cleared on logout

### Session Management

- [ ] Open app in two browser tabs
- [ ] Login in tab 1
- [ ] Tab 2 should reflect logged-in state after refresh
- [ ] Logout in tab 1
- [ ] Tab 2 should redirect to login after navigation

## 1️⃣1️⃣ Performance Tests

### Page Load Speed

- [ ] Login page loads in < 2 seconds
- [ ] First login takes reasonable time
- [ ] Subsequent page navigations are fast
- [ ] No noticeable lag or delays

### Memory Leaks

- [ ] Navigate between pages multiple times
- [ ] No memory warnings in console
- [ ] Browser remains responsive

## 1️⃣2️⃣ Code Quality Tests

### Linter

- [ ] Run linter: `npm run format` (or lint command)
- [ ] No linter errors in auth files
- [ ] Code follows project conventions

### TypeScript

- [ ] No TypeScript errors in console
- [ ] All types are properly defined
- [ ] IntelliSense works in IDE

### Console Errors

- [ ] No errors in browser console
- [ ] No warnings (except known harmless ones)
- [ ] No failed network requests (except intentional tests)

## 1️⃣3️⃣ Edge Cases

### Multiple Rapid Logins

- [ ] Login
- [ ] Immediately logout
- [ ] Immediately login again
- [ ] No errors or race conditions

### Refresh During Login

- [ ] Start login process
- [ ] Before completion, refresh page
- [ ] App recovers gracefully
- [ ] Can login again

### Browser Back Button

- [ ] Login successfully
- [ ] Navigate to different pages
- [ ] Use browser back button
- [ ] Navigation works correctly
- [ ] No authentication errors

### Direct URL Access

- [ ] While logged out, access `/home` directly
- [ ] Should redirect to `/login`
- [ ] After redirecting, login
- [ ] Should go back to originally requested page (or home)

## 1️⃣4️⃣ Integration Tests

### With OpenAPI Services

- [ ] All service methods include Authorization header
- [ ] No 401 errors on legitimate requests
- [ ] Services work as expected

### With Umi Request Plugin

- [ ] Request interceptors work
- [ ] Response interceptors work
- [ ] Error handling works

### With Access Control

- [ ] `isAuthenticated` permission works
- [ ] `canSeeAdmin` permission works
- [ ] Protected routes respect access rules

## 📊 Test Results Summary

After completing all tests, fill in:

- **Total Tests**: **\_** / 120+
- **Passed**: **\_**
- **Failed**: **\_**
- **Skipped**: **\_**

### Critical Issues (Must Fix)

1.
2.
3.

### Minor Issues (Nice to Fix)

1.
2.
3.

### Notes

-
-
-

## ✅ Sign Off

- [ ] All critical tests pass
- [ ] No blocking issues
- [ ] Code is ready for production (or further development)
- [ ] Documentation is complete
- [ ] Team has been notified

**Tester Name**: ********\_********

**Date**: ********\_********

**Version**: ********\_********

## 🎯 Quick Smoke Test (5 minutes)

If you're short on time, run these essential tests:

1. [ ] Navigate to app → redirects to login
2. [ ] Login with valid credentials → succeeds
3. [ ] Token stored in localStorage
4. [ ] Redirected to home page
5. [ ] Home page displays authentication status
6. [ ] Protected routes are accessible
7. [ ] Logout works
8. [ ] Token removed from localStorage
9. [ ] Redirected to login page
10. [ ] Cannot access protected routes

If all 10 pass, the core functionality works! ✅

## 🔗 Related Documentation

- `AUTH_QUICKSTART.md` - Quick start guide
- `AUTH_IMPLEMENTATION.md` - Technical details
- `AUTH_ARCHITECTURE.md` - Architecture diagrams
- `IMPLEMENTATION_SUMMARY.md` - Overview
