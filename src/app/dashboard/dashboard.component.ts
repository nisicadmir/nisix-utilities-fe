import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MENU_ITEMS } from '../models/menu-item.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  menuItems = MENU_ITEMS;
}
