# Firebase Security Rules Testing Guide

This guide helps you verify that Firestore security rules are working correctly.

## Quick Test

### 1. Deploy Rules

```bash
npm run firebase:deploy-rules
```

### 2. Test in Browser Console

Open your app in the browser and run these tests in the console:

#### Test 1: User Can Access Own Data ✅
```javascript
// After logging in, this should work:
import { db } from './src/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from './src/config/firebase';

const user = auth.currentUser;
if (user) {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  console.log('✅ Own profile:', userDoc.data());
}
```

#### Test 2: User Cannot Access Other User's Data ❌
```javascript
// This should fail with permission denied:
import { db } from './src/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Try to access a different user's data (replace with actual other user ID)
const otherUserId = 'some-other-user-id';
try {
  const otherDoc = await getDoc(doc(db, 'users', otherUserId));
  console.log('❌ Should not reach here');
} catch (error) {
  console.log('✅ Correctly denied:', error.message);
}
```

#### Test 3: Unauthenticated User Cannot Access Data ❌
```javascript
// After logging out, this should fail:
import { db } from './src/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth } from './src/config/firebase';

await signOut(auth);
try {
  const userDoc = await getDoc(doc(db, 'users', 'any-user-id'));
  console.log('❌ Should not reach here');
} catch (error) {
  console.log('✅ Correctly denied:', error.message);
}
```

## Using Firebase Console Rules Playground

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **PraxisMakesPerfect**
3. Navigate to **Firestore Database** → **Rules** tab
4. Click **Rules Playground** tab
5. Test these scenarios:

### Scenario 1: Authenticated User Reads Own Profile
- **Location**: `users/{userId}` where `userId` = authenticated user's UID
- **Authenticated**: Yes
- **Expected**: ✅ Allow read

### Scenario 2: Authenticated User Writes Own Profile
- **Location**: `users/{userId}` where `userId` = authenticated user's UID
- **Authenticated**: Yes
- **Operation**: Write
- **Expected**: ✅ Allow write

### Scenario 3: Authenticated User Tries to Access Other User's Profile
- **Location**: `users/{otherUserId}` where `otherUserId` ≠ authenticated user's UID
- **Authenticated**: Yes
- **Expected**: ❌ Deny read/write

### Scenario 4: Unauthenticated User Tries to Access Any Profile
- **Location**: `users/{userId}`
- **Authenticated**: No
- **Expected**: ❌ Deny read/write

### Scenario 5: User Creates Response Log
- **Location**: `users/{userId}/responses/{responseId}` where `userId` = authenticated user's UID
- **Authenticated**: Yes
- **Operation**: Create
- **Expected**: ✅ Allow create

### Scenario 6: User Tries to Access Other User's Response Logs
- **Location**: `users/{otherUserId}/responses/{responseId}` where `otherUserId` ≠ authenticated user's UID
- **Authenticated**: Yes
- **Expected**: ❌ Deny read/write

## Automated Testing with Firebase Emulator

For more thorough testing, use the Firebase Emulator Suite:

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Start emulators
firebase emulators:start --only firestore

# In another terminal, run your app pointing to emulator
# Update firebase.ts to use emulator when in development
```

## Expected Behavior

### ✅ Should Work
- User can read their own profile
- User can write/update their own profile
- User can create response logs in their subcollection
- User can read their own response logs
- User can update their own response logs

### ❌ Should Fail (Permission Denied)
- User tries to read another user's profile
- User tries to write another user's profile
- User tries to access another user's response logs
- Unauthenticated user tries to access any data
- User tries to access collections outside `users/{userId}`

## Troubleshooting

### Rules Not Taking Effect
- Wait a few seconds after deploying (rules can take up to 1 minute to propagate)
- Clear browser cache and reload
- Check Firebase Console → Firestore → Rules to verify rules are published

### Permission Denied Errors When They Should Work
- Verify user is authenticated: `auth.currentUser !== null`
- Verify user ID matches: `request.auth.uid == userId`
- Check browser console for detailed error messages
- Verify rules syntax is correct (use Firebase Console validator)

### Rules Deploy Fails
- Check that `firestore.rules` file exists
- Verify Firebase CLI is logged in: `firebase login`
- Check project ID matches: `.firebaserc` should have correct project ID

## Security Checklist

- [ ] Rules deployed successfully
- [ ] Users can only access their own `users/{userId}` document
- [ ] Users can only access their own `users/{userId}/responses` subcollection
- [ ] Unauthenticated users cannot access any data
- [ ] Cross-user access is denied
- [ ] Rules are tested in production (not just emulator)
