# Fix: Firebase auth/unauthorized-domain Error

> Status: Canonical troubleshooting guide. Reviewed during documentation consolidation on 2026-03-14. Keep this as the targeted fix for Firebase authorized-domain issues.

## Problem
You're seeing: `Firebase: Error (auth/unauthorized-domain)`

This happens when you try to use Firebase Authentication from a domain that isn't authorized in Firebase Console.

## Solution: Add Your Domain to Authorized Domains

### Step 1: Go to Firebase Console Settings

**Direct Link**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/settings

### Step 2: Add Your Domain

1. Scroll down to **"Authorized domains"** section
2. Click **"Add domain"** button
3. Enter your domain:

#### For Local Development:
- Add: `localhost`
- (This should already be there, but verify it exists)

#### For Vercel Deployment:
- Add: `your-app-name.vercel.app`
- Or your custom domain if you have one

#### For Netlify Deployment:
- Add: `your-app-name.netlify.app`
- Or your custom domain if you have one

#### For Firebase Hosting:
- Add: `praxismakesperfect-65c57.web.app`
- Add: `praxismakesperfect-65c57.firebaseapp.com`
- (These should already be there)

### Step 3: Save

Click **"Add"** or **"Save"** to save the domain.

---

## Common Domains to Add

### Development
- ✅ `localhost` (should already be there)
- ✅ `127.0.0.1` (if you're using IP address)

### Production (Vercel)
- Add your Vercel URL: `praxismakesperfect.vercel.app` (or your actual URL)
- Add custom domain if you have one

### Production (Netlify)
- Add your Netlify URL: `praxismakesperfect.netlify.app` (or your actual URL)
- Add custom domain if you have one

---

## How to Find Your Domain

### If Deployed on Vercel:
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Check the **"Domains"** section
4. Copy the `.vercel.app` domain

### If Deployed on Netlify:
1. Go to https://app.netlify.com
2. Click on your site
3. Check the **"Domain settings"**
4. Copy the `.netlify.app` domain

### If Running Locally:
- Use: `localhost`
- Or: `127.0.0.1` (if using IP)

---

## Quick Fix Steps

1. **Open Firebase Console**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/settings

2. **Find "Authorized domains"** section

3. **Click "Add domain"**

4. **Enter your domain** (without `http://` or `https://`)
   - Example: `localhost`
   - Example: `praxismakesperfect.vercel.app`
   - Example: `praxismakesperfect.netlify.app`

5. **Click "Add"**

6. **Wait a few seconds** for changes to propagate

7. **Refresh your app** and try authentication again

---

## Verify It's Fixed

After adding the domain:
1. Wait 10-30 seconds for changes to propagate
2. Refresh your app
3. Try signing in again
4. The error should be gone!

---

## Troubleshooting

### Domain Still Not Working?
- Make sure you entered the domain **without** `http://` or `https://`
- Make sure you entered the domain **without** trailing slash `/`
- Wait a bit longer (can take up to 1 minute to propagate)
- Clear browser cache and try again

### Multiple Domains?
- You can add multiple domains
- Each deployment platform needs its own domain added
- Localhost should always be there for development

### Still Having Issues?
- Check browser console for the exact domain being used
- Verify the domain matches exactly what's in Firebase Console
- Make sure you're logged into the correct Firebase project

---

## Example Domains List

Your authorized domains should look like this:

```
✅ localhost
✅ praxismakesperfect-65c57.firebaseapp.com
✅ praxismakesperfect-65c57.web.app
✅ your-app.vercel.app (if deployed on Vercel)
✅ your-app.netlify.app (if deployed on Netlify)
```

---

## Direct Links

- **Firebase Auth Settings**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/settings
- **Firebase Console**: https://console.firebase.google.com/project/praxismakesperfect-65c57
