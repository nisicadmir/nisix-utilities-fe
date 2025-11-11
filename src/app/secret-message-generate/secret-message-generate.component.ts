import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { environment } from 'src/environments/environment';
import { LoaderService } from '../_modules/loader/loader.service';
import { CryptoService } from '../crypto.service';
import { FirestoreService } from '../_firestore/firestore.service';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-secret-message-generate',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './secret-message-generate.component.html',
  styleUrl: './secret-message-generate.component.scss',
})
export class SecretMessageGenerateComponent {
  public urlLink = '';
  formGroup = new FormGroup({
    message: new FormControl('', [Validators.required]),
    durationInSeconds: new FormControl(10, [Validators.required, Validators.min(1), Validators.max(90)]),
  });

  constructor(
    private firestoreService: FirestoreService,
    private cryptoService: CryptoService,
    private utilService: UtilService,
    private loaderService: LoaderService,
  ) {}

  public async generateSecretMessage() {
    if (this.formGroup.invalid) {
      return;
    }

    this.loaderService.show();

    try {
      const message = this.formGroup.value.message!;
      const durationInSeconds = this.formGroup.value.durationInSeconds!;

      // Generate random key for encryption
      const secretKey = this.cryptoService.generateRandomKey();

      // Encrypt the message
      const encryptedMessage = this.cryptoService.encryptMessage(message, secretKey);

      // Store in Firestore
      const response = await this.firestoreService.storeMessage(encryptedMessage, durationInSeconds);

      // Update URL with the actual messageId from Firestore
      this.urlLink = `${environment.url}/secret-message-read?messageId=${response.messageId}&secretKey=${secretKey}`;

      // Copy the link to clipboard
      this.copyMessageId();
    } catch (error) {
      console.error('Error generating secret message:', error);
    } finally {
      this.loaderService.hide();
    }
  }

  public copyMessageId(): void {
    this.utilService.copyToClipboard(this.urlLink);
  }
}
