import { Component, effect, OnInit, signal } from '@angular/core';
import { LoaderService } from './loader.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent {
  isLoading = signal<boolean>(false);

  constructor(private loaderService: LoaderService) {
    effect(() => {
      this.isLoading.set(this.loaderService.isLoading());
    });
  }
}
