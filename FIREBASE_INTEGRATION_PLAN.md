# Firebase Integration Plan

## Overview
This plan outlines the steps to integrate Firebase into the Praxis Study App. Firebase will be initialized with Analytics enabled.

## Project Structure
- **Framework**: React + Vite + TypeScript
- **Current State**: Local-only app using localStorage
- **Target**: Add Firebase SDK with Analytics

---

## Implementation Steps

### 1. Install Firebase Dependencies
```bash
npm install firebase
```

### 2. Create Firebase Configuration File
**Location**: `src/config/firebase.ts`

This file will contain:
- Firebase configuration object
- Firebase app initialization
- Analytics initialization (with conditional check for browser environment)
- Exported app and analytics instances for use throughout the app

**Structure**:
```typescript
import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBCtABgT9UVIT89RHQWSXgnRS14GAy89_o",
  authDomain: "praxismakesperfect-65c57.firebaseapp.com",
  projectId: "praxismakesperfect-65c57",
  storageBucket: "praxismakesperfect-65c57.firebasestorage.app",
  messagingSenderId: "521016285044",
  appId: "1:521016285044:web:7f9b7ac0f872b7a85efe21",
  measurementId: "G-CCYSWQ24BF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
```

### 3. Initialize Firebase in Main Entry Point
**Location**: `src/main.tsx`

Import the Firebase config to ensure it's initialized when the app starts:
```typescript
import './config/firebase'; // Initialize Firebase
```

### 4. Optional: Environment Variables (Recommended for Production)
**Location**: `.env.local` (gitignored)

For better security and flexibility, consider moving config to environment variables:
```env
VITE_FIREBASE_API_KEY=AIzaSyBCtABgT9UVIT89RHQWSXgnRS14GAy89_o
VITE_FIREBASE_AUTH_DOMAIN=praxismakesperfect-65c57.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=praxismakesperfect-65c57
VITE_FIREBASE_STORAGE_BUCKET=praxismakesperfect-65c57.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=521016285044
VITE_FIREBASE_APP_ID=1:521016285044:web:7f9b7ac0f872b7a85efe21
VITE_FIREBASE_MEASUREMENT_ID=G-CCYSWQ24BF
```

**Note**: Firebase config values are safe to expose client-side, but using env vars provides flexibility for different environments.

### 5. Update .gitignore
Ensure `.env.local` is already in `.gitignore` (it is - checked ✓)

---

## File Structure After Integration

```
PraxisMakesPerfect/
├── src/
│   ├── config/
│   │   └── firebase.ts          # NEW: Firebase configuration
│   ├── main.tsx                 # MODIFIED: Import Firebase config
│   └── ...
├── .env.local                   # NEW (optional): Environment variables
├── package.json                 # MODIFIED: Add firebase dependency
└── FIREBASE_INTEGRATION_PLAN.md # This file
```

---

## Security Considerations

1. **Firebase Config Exposure**: Firebase configuration values are designed to be public and safe to expose in client-side code. They're not secrets.

2. **API Key Restrictions**: Consider setting up API key restrictions in Firebase Console:
   - HTTP referrer restrictions for web apps
   - Domain restrictions

3. **Firebase Security Rules**: Ensure proper security rules are set up for any Firebase services you use (Firestore, Storage, etc.)

---

## Next Steps After Integration

Once Firebase is initialized, you can:

1. **Add Authentication**: Use Firebase Auth for user management
2. **Add Firestore**: Replace localStorage with Firestore for cloud data sync
3. **Add Storage**: Store user files/images if needed
4. **Analytics Events**: Track custom events throughout the app
5. **Remote Config**: Manage app configuration remotely

---

## Testing Checklist

- [ ] Firebase initializes without errors
- [ ] Analytics loads in browser (check Network tab)
- [ ] No console errors on app startup
- [ ] App functionality unchanged (localStorage still works)
- [ ] Build process completes successfully (`npm run build`)

---

## Notes

- Analytics will only initialize in browser environments (not during SSR/build)
- The Firebase app instance can be imported anywhere: `import { app } from './config/firebase'`
- Analytics instance can be imported: `import { analytics } from './config/firebase'`
- Consider adding error handling for Firebase initialization failures
