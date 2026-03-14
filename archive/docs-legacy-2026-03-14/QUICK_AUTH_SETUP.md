# Quick Firebase Authentication Setup

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable Authentication Providers

Go to Firebase Console and enable the providers:

**Direct Links:**
- **Email/Password**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/providers
  - Click "Email/Password" → Enable → Save

- **Google**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/providers
  - Click "Google" → Enable → Configure → Save

- **Anonymous** (optional): https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/providers
  - Click "Anonymous" → Enable → Save

### Step 2: Verify Authorized Domains

Go to: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/settings

Ensure `localhost` is in the **Authorized domains** list (it should be there by default).

### Step 3: Test

1. Run: `npm run dev`
2. Open: http://localhost:5173
3. Test each sign-in method:
   - ✅ Email sign-up
   - ✅ Email sign-in
   - ✅ Google sign-in
   - ✅ Password reset

---

## ✅ Verification

After setup, you should be able to:

- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Google
- [ ] Reset password
- [ ] See users in Firebase Console → Authentication → Users

---

## 🔗 Quick Links

- **Firebase Console**: https://console.firebase.google.com/project/praxismakesperfect-65c57
- **Authentication**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication
- **Users**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/users
- **Sign-in Methods**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/providers

---

## 📚 Detailed Guide

For more detailed instructions, see: `FIREBASE_AUTH_SETUP.md`
