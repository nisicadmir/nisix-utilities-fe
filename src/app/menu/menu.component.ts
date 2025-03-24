import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [RouterModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  isMenuOpen = false;

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
}
