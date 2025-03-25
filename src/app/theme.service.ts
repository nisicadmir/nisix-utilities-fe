import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(this.getStoredTheme());
  isDarkTheme$ = this.isDarkTheme.asObservable();

  constructor() {
    // Apply the stored theme on initialization
    this.applyTheme(this.isDarkTheme.value);
  }

  private getStoredTheme(): boolean {
    const storedTheme = localStorage.getItem('isDarkTheme');
    return storedTheme ? JSON.parse(storedTheme) : false;
  }

  private applyTheme(isDark: boolean) {
    document.body.classList.toggle('dark-theme', isDark);
    document.body.classList.toggle('light-theme', !isDark);
  }

  toggleTheme() {
    const newTheme = !this.isDarkTheme.value;
    this.isDarkTheme.next(newTheme);

    // Save to localStorage
    localStorage.setItem('isDarkTheme', JSON.stringify(newTheme));
    this.applyTheme(newTheme);
  }
}
