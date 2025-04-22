import { Component, OnInit, signal } from '@angular/core';
import { LoaderService } from './loader.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent implements OnInit {
  isLoading = signal<boolean>(false);

  constructor(private loaderService: LoaderService) {}

  ngOnInit() {
    this.isLoading.set(this.loaderService.isLoading());
  }
}
