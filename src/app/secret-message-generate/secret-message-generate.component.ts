import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpService } from '../http.service';
import { environment } from 'src/environments/environment';
import { UtilService } from '../util.service';
import { LoaderService } from '../_modules/loader/loader.service';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-secret-message-generate',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MenuComponent],
  templateUrl: './secret-message-generate.component.html',
  styleUrl: './secret-message-generate.component.scss',
})
export class SecretMessageGenerateComponent {
  public urlLink = '';
  formGroup = new FormGroup({
    message: new FormControl('', [Validators.required]),
    durationInSeconds: new FormControl(10, [Validators.required, Validators.min(1), Validators.max(90)]),
  });

  constructor(private httpService: HttpService, private utilService: UtilService, private loaderService: LoaderService) {}

  public generateSecretMessage() {
    if (this.formGroup.invalid) {
      return;
    }

    this.loaderService.show();
    console.log('formGroup.value', this.formGroup.value);
    this.httpService
      .post<{
        messageId: string;
        secretKey: string;
      }>('secret-message/generate', this.formGroup.value)
      .subscribe({
        next: (response) => {
          const messageId = response.messageId;
          const secretKey = response.secretKey;
          this.copyMessageId();
          this.urlLink = `${environment.url}/#/secret-message-read?messageId=${messageId}&secretKey=${secretKey}`;
        },
        error: (error) => {
          console.error(error);
        },
        complete: () => {
          this.loaderService.hide();
        },
      });
  }

  public copyMessageId(): void {
    this.utilService.copyToClipboard(this.urlLink);
  }
}
