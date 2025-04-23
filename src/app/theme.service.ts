import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isBrowser: boolean;
  isDarkTheme$ = new BehaviorSubject<boolean>(false);

  constructor(private storageService: StorageService, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Only run in browser
    if (this.isBrowser) {
      const stored = this.getStoredTheme();
      this.isDarkTheme$.next(stored);
      this.applyTheme(stored);
    }
  }

  private getStoredTheme(): boolean {
    const storedTheme = this.storageService.getItem<boolean>('isDarkTheme');
    return storedTheme ?? false;
  }

  private applyTheme(isDark: boolean) {
    if (!this.isBrowser) {
      return;
    }

    document.body.classList.toggle('dark-theme', isDark);
    document.body.classList.toggle('light-theme', !isDark);
  }

  toggleTheme() {
    if (!this.isBrowser) return;

    const newTheme = !this.isDarkTheme$.value;
    this.isDarkTheme$.next(newTheme);
    this.storageService.setItem('isDarkTheme', newTheme);
    this.applyTheme(newTheme);
  }
}
