import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { environment } from '../environments/environment';

// Initialize Firebase
const app = initializeApp(environment.firebase);

// Initialize App Check with reCAPTCHA v3
// Note: Replace 'your-recaptcha-site-key' with your actual reCAPTCHA v3 site key from Firebase Console
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
  isTokenAutoRefreshEnabled: true,
});

// Initialize Firestore
export const db = getFirestore(app);
