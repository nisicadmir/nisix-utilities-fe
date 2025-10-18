import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Initialize Firebase and App Check early
import './app/firebase.config';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
