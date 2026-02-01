# Deployment Guide - Deploy Your App Online

Your code is now on GitHub! Here's how to deploy it so you can view it online.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with GitHub
3. **Click "New Project"**
4. **Import your repository**: `clebronrivera/PraxisMakesPerfect`
5. **Configure**:
   - Framework Preset: Vite
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
6. **Click "Deploy"**
7. ✅ Your app will be live at `https://praxismakesperfect.vercel.app` (or similar)

**Automatic deployments**: Every push to your branch will auto-deploy!

---

### Option 2: Netlify

1. **Go to Netlify**: https://netlify.com
2. **Sign in** with GitHub
3. **Click "Add new site" → "Import an existing project"**
4. **Select your repository**: `clebronrivera/PraxisMakesPerfect`
5. **Configure**:
   - Build command: `npm run build` (auto-detected)
   - Publish directory: `dist` (auto-detected)
6. **Click "Deploy site"**
7. ✅ Your app will be live at `https://praxismakesperfect.netlify.app` (or similar)

**Automatic deployments**: Every push will auto-deploy!

---

### Option 3: Firebase Hosting

1. **Install Firebase CLI** (if not already):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize hosting** (if not already):
   ```bash
   firebase init hosting
   ```
   - Select existing project: `praxismakesperfect-65c57`
   - Public directory: `dist`
   - Configure as single-page app: Yes
   - Set up automatic builds: No (or Yes if you want GitHub integration)

4. **Build and deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

5. ✅ Your app will be live at: `https://praxismakesperfect-65c57.web.app`

---

## ⚙️ Before Deploying - Important!

### 1. Enable Firebase Authentication Providers

Before your app works online, enable authentication in Firebase Console:

- **Email/Password**: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/providers
- **Google**: Same link → Enable Google provider
- **Authorized Domains**: Add your deployment domain (Vercel/Netlify URL)

### 2. Add Authorized Domains

After deploying, add your production domain:

1. Go to: https://console.firebase.google.com/project/praxismakesperfect-65c57/authentication/settings
2. Under "Authorized domains", click "Add domain"
3. Add your deployment URL (e.g., `praxismakesperfect.vercel.app`)

### 3. Deploy Firestore Security Rules

```bash
npm run firebase:deploy-rules
```

---

## 📋 Deployment Checklist

- [ ] Code pushed to GitHub ✅
- [ ] Deploy to Vercel/Netlify/Firebase
- [ ] Enable Firebase Authentication providers
- [ ] Add production domain to Authorized domains
- [ ] Deploy Firestore security rules
- [ ] Test authentication in production
- [ ] Verify users can sign up/sign in

---

## 🔗 Your Repository

**GitHub**: https://github.com/clebronrivera/PraxisMakesPerfect

**Current Branch**: `phase-2-assessment-modes`

---

## 🎯 Recommended: Vercel

Vercel is the easiest option:
- ✅ Auto-detects Vite configuration
- ✅ Automatic deployments on push
- ✅ Free SSL certificate
- ✅ Custom domain support
- ✅ Preview deployments for PRs

**Deploy now**: https://vercel.com/new

---

## 📝 Environment Variables (if needed)

If you add environment variables later, add them in:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Firebase**: Not needed (config is in code)

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in deployment platform
- Ensure `npm run build` works locally first
- Check for TypeScript errors

### Authentication Not Working
- Verify Firebase providers are enabled
- Check authorized domains include your deployment URL
- Check browser console for errors

### 404 Errors on Routes
- Ensure SPA routing is configured (already done in configs)
- Check redirect rules in deployment platform

---

## ✨ Next Steps After Deployment

1. **Test authentication** in production
2. **Share your app** with others
3. **Monitor usage** in Firebase Console
4. **Set up custom domain** (optional)
