# Firebase Authentication Setup Guide

This guide will help you configure Firebase Authentication for email/password and Google sign-in.

## Project Information

- **Project ID**: `praxismakesperfect-65c57`
- **Project Name**: PraxisMakesPerfect
- **Firebase Console**: https://console.firebase.google.com/project/praxismakesperfect-65c57

---

## Step 1: Enable Email/Password Authentication

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication

2. **Navigate to Sign-in method**
   - Click on **"Authentication"** in the left sidebar
   - Click on **"Sign-in method"** tab

3. **Enable Email/Password**
   - Find **"Email/Password"** in the list
   - Click on it
   - Toggle **"Enable"** to ON
   - Under **"Email/Password"**, ensure both are enabled:
     - ✅ **Email/Password** (for email/password sign-in)
     - ✅ **Email link (passwordless sign-in)** - Optional, can leave disabled
   - Click **"Save"**

---

## Step 2: Enable Google Authentication

1. **Enable Google Provider**
   - In the same **"Sign-in method"** page
   - Find **"Google"** in the list
   - Click on it
   - Toggle **"Enable"** to ON

2. **Configure Google OAuth**
   - **Project support email**: Select your email address
   - **Project public-facing name**: "Praxis Study App" (or your preferred name)
   - Click **"Save"**

3. **OAuth Consent Screen** (if prompted)
   - Firebase will automatically configure the OAuth consent screen
   - If you need to customize it:
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Select project: **praxismakesperfect-65c57**
     - Navigate to **APIs & Services** → **OAuth consent screen**
     - Configure as needed

---

## Step 3: Enable Anonymous Authentication (Optional)

1. **Enable Anonymous Provider**
   - In **"Sign-in method"** page
   - Find **"Anonymous"** in the list
   - Click on it
   - Toggle **"Enable"** to ON
   - Click **"Save"**

---

## Step 4: Configure Authorized Domains

1. **Go to Authentication Settings**
   - In Firebase Console → Authentication
   - Click on **"Settings"** tab
   - Scroll to **"Authorized domains"**

2. **Add Domains**
   - Default domains are already included:
     - `praxismakesperfect-65c57.firebaseapp.com`
     - `praxismakesperfect-65c57.web.app`
   - For local development, add:
     - `localhost` (should already be there)
   - For production, add your custom domain if you have one

---

## Step 5: Verify Firebase Configuration

Your Firebase config is already set up in `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBCtABgT9UVIT89RHQWSXgnRS14GAy89_o",
  authDomain: "praxismakesperfect-65c57.firebaseapp.com",
  projectId: "praxismakesperfect-65c57",
  // ... other config
};
```

✅ This is already configured correctly!

---

## Step 6: Test Authentication

### Test Email/Password Sign-Up

1. Run your app: `npm run dev`
2. Open http://localhost:5173
3. Click **"Don't have an account? Sign up"**
4. Enter:
   - Name: Your name
   - Email: test@example.com
   - Password: (at least 6 characters)
5. Click **"Create Account"**
6. ✅ Should successfully create account and sign you in

### Test Email/Password Sign-In

1. Sign out if signed in
2. Enter your email and password
3. Click **"Sign In"**
4. ✅ Should successfully sign you in

### Test Google Sign-In

1. Click **"Continue with Google"**
2. Select your Google account
3. Grant permissions if prompted
4. ✅ Should successfully sign you in with Google

### Test Password Reset

1. On login screen, click **"Forgot password?"**
2. Enter your email
3. Click **"Send Reset Email"**
4. ✅ Should show success message
5. Check your email for reset link

---

## Troubleshooting

### Google Sign-In Not Working

**Issue**: Popup blocked or error occurs

**Solutions**:
1. **Check if Google provider is enabled** in Firebase Console
2. **Allow popups** in your browser for localhost
3. **Check browser console** for specific error messages
4. **Verify OAuth consent screen** is configured in Google Cloud Console

### Email/Password Not Working

**Issue**: "Email already in use" or "User not found"

**Solutions**:
1. **Check Firebase Console** → Authentication → Users
   - See if user already exists
   - Delete test users if needed
2. **Verify email/password provider is enabled**
3. **Check password requirements** (minimum 6 characters)

### "auth/unauthorized-domain" Error

**Issue**: Domain not authorized

**Solutions**:
1. Go to Firebase Console → Authentication → Settings
2. Add your domain to **"Authorized domains"**
3. For localhost, ensure `localhost` is in the list

### "auth/popup-blocked" Error

**Issue**: Browser blocked the popup

**Solutions**:
1. **Allow popups** for localhost in browser settings
2. **Try a different browser** to test
3. **Check browser console** for popup blocker messages

---

## Verification Checklist

- [ ] Email/Password provider enabled in Firebase Console
- [ ] Google provider enabled in Firebase Console
- [ ] Anonymous provider enabled (optional)
- [ ] Authorized domains configured (localhost included)
- [ ] Test email sign-up works
- [ ] Test email sign-in works
- [ ] Test Google sign-in works
- [ ] Test password reset works
- [ ] Users appear in Firebase Console → Authentication → Users

---

## Firebase Console Links

- **Authentication**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication
- **Users List**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/users
- **Sign-in Methods**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/providers
- **Settings**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/settings

---

## Next Steps

1. **Complete the setup** using the steps above
2. **Test all authentication methods** in your local app
3. **Deploy security rules** if not already done: `npm run firebase:deploy-rules`
4. **Monitor users** in Firebase Console to verify sign-ups are working

---

## Security Notes

- ✅ Firebase config values are safe to expose client-side
- ✅ Security rules protect user data (see `firestore.rules`)
- ✅ Passwords are securely hashed by Firebase
- ✅ OAuth tokens are managed securely by Firebase
- ✅ User data is stored in Firestore under `users/{userId}`

---

## Support

If you encounter issues:
1. Check browser console for error messages
2. Check Firebase Console → Authentication → Users for user creation
3. Verify all providers are enabled in Sign-in method
4. Check Firebase Console → Authentication → Settings for domain configuration
