import { Component, HostListener, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../theme.service';
import { MENU_ITEMS } from '../models/menu-item.model';

@Component({
  selector: 'app-menu',
  imports: [RouterModule, MatIconModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  isMenuOpen = false;
  isDarkTheme = false;
  menuItems = MENU_ITEMS;
  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.themeService.isDarkTheme$.subscribe((isDark) => {
      this.isDarkTheme = isDark;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const menuElement = (event.target as HTMLElement).closest('.hamburger-menu');
    if (!menuElement && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation(); // Prevent the document click handler from immediately closing the menu
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
