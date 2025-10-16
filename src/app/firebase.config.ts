import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { environment } from '../environments/environment';

(<any>self).FIREBASE_APPCHECK_DEBUG_TOKEN = environment.production ? false : true;
// Initialize Firebase
const app = initializeApp(environment.firebase);

// Production: Use reCAPTCHA v3
console.log('Initializing App Check with reCAPTCHA v3.');
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
  isTokenAutoRefreshEnabled: true,
});

// Initialize Firestore
export const db = getFirestore(app);
