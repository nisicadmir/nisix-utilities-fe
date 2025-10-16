import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { environment } from '../environments/environment';

// Initialize Firebase
const app = initializeApp(environment.firebase);

// Initialize App Check only if site key is configured
if (environment.recaptchaSiteKey && environment.recaptchaSiteKey !== 'your-recaptcha-site-key') {
  console.log('Initializing Firebase App Check with reCAPTCHA v3...');

  // Enable debug token for development
  if (!environment.production) {
    (<any>self).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('✅ Firebase App Check initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase App Check:', error);
    console.warn('🔧 Make sure App Check is enabled in Firebase Console and reCAPTCHA site key is correct');
  }
} else {
  console.warn('⚠️  Firebase App Check not initialized - reCAPTCHA site key not configured');
  console.warn('🔧 Follow APP_CHECK_SETUP.md to configure App Check properly');
}

// Initialize Firestore
export const db = getFirestore(app);
console.log('✅ Firestore initialized successfully');
