import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../theme.service';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-menu',
  imports: [RouterModule, MatIconModule, AsyncPipe],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  isMenuOpen = false;
  isDarkTheme$ = this.themeService.isDarkTheme$;

  constructor(private themeService: ThemeService) {}

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

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
