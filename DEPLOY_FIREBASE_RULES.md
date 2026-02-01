# Deploy Firebase Security Rules

## Quick Deploy

```bash
npm run firebase:deploy-rules
```

Or manually:

```bash
firebase deploy --only firestore:rules
```

## What Gets Deployed

The `firestore.rules` file contains security rules that:
- ✅ Allow users to read/write their own profile (`users/{userId}`)
- ✅ Allow users to create/read their own response logs (`users/{userId}/responses/{responseId}`)
- ❌ Deny access to other users' data
- ❌ Deny access to unauthenticated users

## Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **PraxisMakesPerfect**
3. Navigate to **Firestore Database** → **Rules** tab
4. Verify the rules match `firestore.rules` file

## Test After Deployment

See `FIREBASE_SECURITY_TESTING.md` for detailed testing instructions.

Quick test:
1. Open your app in browser
2. Log in as a user
3. Open browser console
4. Try to access another user's data (should fail)
5. Try to access your own data (should work)

## Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
firebase login
```

### "Permission denied" or "Project not found"
```bash
# Check current project
firebase projects:list

# Set correct project
firebase use praxismakesperfect-65c57
```

### Rules not taking effect
- Rules can take up to 1 minute to propagate
- Clear browser cache and reload
- Check Firebase Console to verify rules are published
