import { Component } from '@angular/core';
import { HttpService } from '../http.service';
import { LoaderService } from '../_modules/loader/loader.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-secret-message-read',
  imports: [MenuComponent],
  templateUrl: './secret-message-read.component.html',
  styleUrl: './secret-message-read.component.scss',
})
export class SecretMessageReadComponent {
  public messageId = '';
  public message = '';
  public secretKey = '';

  constructor(
    private httpService: HttpService,
    private loaderService: LoaderService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.messageId = this.route.snapshot.queryParams['messageId'];
    this.secretKey = this.route.snapshot.queryParams['secretKey'];
    this.readSecretMessage();
  }

  public readSecretMessage() {
    this.loaderService.show();

    this.httpService.get<{ message: string }>(`secret-message/read/${this.messageId}/${this.secretKey}`).subscribe({
      next: (response) => {
        this.message = response.message;
        this.loaderService.hide();
      },
      error: (error) => {
        console.error(error);
        this.loaderService.hide();
        this.router.navigate(['/secret-message-generate']);
      },
      complete: () => {},
    });
  }
}
