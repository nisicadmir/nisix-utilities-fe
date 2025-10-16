# Firebase App Check Setup Guide

## Overview

This guide will help you set up Firebase App Check with reCAPTCHA v3 for human verification in your serverless application.

## Step 1: Enable App Check in Firebase Console

1. **Navigate to Firebase Console**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `project-nisix`

2. **Enable App Check**

   - In the left sidebar, click on "App Check" under the "Build" section
   - Click "Get Started"
   - Select your web app: `nisix-utilities-fe`

3. **Configure reCAPTCHA v3 Provider**

   - Choose "reCAPTCHA v3" as the provider
   - Click "Next"
   - You'll be redirected to Google reCAPTCHA Admin Console

4. **Create reCAPTCHA v3 Site**

   - In reCAPTCHA Admin Console, click "Create"
   - Fill in the form:
     - **Label**: `nisix-utilities-app-check`
     - **reCAPTCHA type**: Select "reCAPTCHA v3"
     - **Domains**: Add your domains:
       - `localhost` (for development)
       - `www.nisix.net` (for production)
     - **Accept Terms**: Check the box
   - Click "Submit"

5. **Get Site Key**

   - Copy the **Site Key** (starts with `6L...`)
   - This is what you'll use in your Firebase configuration

6. **Complete App Check Setup**
   - Return to Firebase Console
   - Paste the Site Key
   - Click "Save"

## Step 2: Update Firebase Configuration

1. **Update `src/app/firebase.config.ts`**

   - Replace `'your-recaptcha-site-key'` with your actual Site Key from Step 1.5

2. **Update Environment Files (Optional)**
   - You can add the Site Key to your environment files for better security:
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     // ... existing config
     firebase: {
       // ... existing firebase config
     },
     recaptchaSiteKey: 'your-actual-site-key-here',
   };
   ```

## Step 3: Deploy Firestore Rules

1. **Deploy Updated Rules**

   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Or Deploy via Firebase Console**
   - Go to Firestore Database > Rules
   - Copy the content from `firestore.rules`
   - Click "Publish"

## Step 4: Test the Implementation

1. **Start Development Server**

   ```bash
   ng serve
   ```

2. **Test Secret Message Generation**

   - Navigate to `/secret-message-generate`
   - Try to create a secret message
   - App Check should work invisibly in the background

3. **Monitor App Check**
   - Go to Firebase Console > App Check
   - Check the metrics to see if requests are being verified

## Step 5: Enable Enforcement (Optional)

1. **Enable Enforcement for Firestore**
   - In Firebase Console > App Check
   - Find "Firestore" in the services list
   - Toggle "Enforce" to ON
   - This will block all requests without valid App Check tokens

## Troubleshooting

### Common Issues

1. **"App Check token not found"**

   - Ensure App Check is properly initialized
   - Check that the Site Key is correct
   - Verify the domain is registered in reCAPTCHA

2. **"reCAPTCHA verification failed"**

   - Check that your domain is added to reCAPTCHA settings
   - Ensure you're using reCAPTCHA v3 (not v2)

3. **Development Issues**
   - Make sure `localhost` is added to reCAPTCHA domains
   - You can use a debug token for development (see Firebase docs)

### Debug Mode (Development Only)

For development, you can enable debug mode:

```typescript
// Only for development - remove in production
if (environment.production === false) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('your-site-key'),
    isTokenAutoRefreshEnabled: true,
    debugToken: 'your-debug-token', // Get this from Firebase Console
  });
}
```

## Security Notes

- App Check tokens are automatically attached to Firestore requests
- No user interaction required - verification happens invisibly
- Tokens are refreshed automatically
- Only requests from your registered domains will be accepted

## Next Steps

After setup, your application will have:

- ✅ Human verification via reCAPTCHA v3
- ✅ Serverless implementation (no backend changes needed)
- ✅ Invisible user experience
- ✅ Protection against bots and abuse
- ✅ Integration with existing Firebase services

## Support

If you encounter issues:

1. Check Firebase Console > App Check for error messages
2. Verify reCAPTCHA domain settings
3. Check browser console for App Check errors
4. Review Firebase App Check documentation
