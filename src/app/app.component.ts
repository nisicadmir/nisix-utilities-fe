import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from './_modules/loader/loader.component';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterModule, AsyncPipe, LoaderComponent],
})
export class AppComponent {
  isDarkTheme$ = this.themeService.isDarkTheme$;

  constructor(private themeService: ThemeService) {}
}
