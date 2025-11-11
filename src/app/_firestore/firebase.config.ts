import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getToken, initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { environment } from '../../environments/environment';

// Initialize Firebase
const app = initializeApp(environment.firebase);

// Initialize App Check first, then Firestore
let appCheckInitialized = false;
console.log('recaptchaSiteKey', environment.recaptchaSiteKey);

if (environment.recaptchaSiteKey && environment.recaptchaSiteKey !== 'your-recaptcha-site-key') {
  console.log('Initializing Firebase App Check with reCAPTCHA v3...');

  // Enable debug token for development. Use explicit token from environment if provided.
  if (!environment.production) {
    if (environment.appCheckDebugToken && environment.appCheckDebugToken.length > 0) {
      (<any>self).FIREBASE_APPCHECK_DEBUG_TOKEN = environment.appCheckDebugToken;
      console.log('Using App Check debug token from environment:', environment.appCheckDebugToken);
    } else {
      // Fall back to boolean true which causes the SDK to log a generated debug token
      (<any>self).FIREBASE_APPCHECK_DEBUG_TOKEN = environment.useAppCheckDebugToken;
      console.log('App Check debug token will be auto-generated and logged to console');
    }
  }

  try {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
    console.log('✅ Firebase App Check initialized successfully');

    // optional: get a token manually (for debugging)
    getToken(appCheck, /* forceRefresh= */ false)
      .then((tokenResult) => {
        if (!environment.production) {
          console.log('AppCheck token:', tokenResult.token);
        }
      })
      .catch((err) => {
        console.warn('AppCheck token error:', err);
      });
  } catch (error) {
    console.error('❌ Failed to initialize Firebase App Check:', error);
    console.warn('🔧 Make sure App Check is enabled in Firebase Console and reCAPTCHA site key is correct');
  }
} else {
  console.warn('⚠️  Firebase App Check not initialized - reCAPTCHA site key not configured');
  console.warn('🔧 Follow APP_CHECK_SETUP.md to configure App Check properly');
}

// Initialize Firestore after App Check
export const db = getFirestore(app);
console.log('✅ Firestore initialized successfully');
console.log('App Check status:', appCheckInitialized ? '✅ Enabled' : '❌ Disabled');
