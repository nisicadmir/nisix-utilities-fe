import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { environment } from '../environments/environment';

// Initialize Firebase

console.log('Initializing App Check with site key:');
const app = initializeApp(environment.firebase);

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
  isTokenAutoRefreshEnabled: true,
});

// Initialize Firestore
export const db = getFirestore(app);
