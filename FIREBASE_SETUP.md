# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `nisix-utilities`
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security rules later)
4. Select a location (choose closest to your users)
5. Click "Done"

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (`</>`)
4. Enter app nickname: `nisix-utilities-fe`
5. Click "Register app"
6. Copy the Firebase configuration object

## 4. Update Environment Files

Replace the placeholder values in:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

With your actual Firebase config:

```typescript
firebase: {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
}
```

## 5. Configure Security Rules

1. Go to "Firestore Database" > "Rules"
2. Replace the default rules with the content from `firestore.rules`
3. Click "Publish"

## 6. Test the Implementation

1. Run `ng serve`
2. Navigate to the secret message generator
3. Create a test message
4. Verify it works end-to-end

## 7. Deploy Security Rules (Optional)

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:rules
```

## Notes

- The security rules allow public read/write access intentionally for secret message sharing
- Messages are encrypted client-side before storing
- Expired messages are automatically cleaned up
- No authentication required for this use case
