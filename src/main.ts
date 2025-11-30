import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Make environment variables available globally for index.html scripts
(window as any).recaptchaSiteKey = environment.recaptchaSiteKey;

// Initialize Firebase and App Check early
import './app/_firestore/firebase.config';

bootstrapApplication(AppComponent, appConfig).catch(
  (err) => console.error(err),
);
