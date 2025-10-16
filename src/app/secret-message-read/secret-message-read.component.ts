import { Component } from '@angular/core';
import { LoaderService } from '../_modules/loader/loader.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { FirestoreService } from '../firestore.service';
import { CryptoService } from '../crypto.service';

@Component({
  selector: 'app-secret-message-read',
  imports: [MenuComponent],
  templateUrl: './secret-message-read.component.html',
  styleUrl: './secret-message-read.component.scss',
})
export class SecretMessageReadComponent {
  public messageId = '';
  public message = '';
  public durationInSeconds: number = 0;
  public secretKey = '';

  constructor(
    private firestoreService: FirestoreService,
    private cryptoService: CryptoService,
    private loaderService: LoaderService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.messageId = this.route.snapshot.queryParams['messageId'];
    this.secretKey = this.route.snapshot.queryParams['secretKey'];
    console.log('Reading message with ID:', this.messageId);
    console.log('Secret key:', this.secretKey);
    this.readSecretMessage();
  }

  public async readSecretMessage() {
    this.loaderService.show();

    try {
      console.log('Attempting to retrieve message with ID:', this.messageId);

      // Retrieve the encrypted message from Firestore
      const secretMessage = await this.firestoreService.getMessage(this.messageId);

      console.log('Retrieved message:', secretMessage);

      if (!secretMessage) {
        console.log('Message not found or expired');
        throw new Error('Message not found or expired');
      }

      console.log('Decrypting message with key:', this.secretKey);

      // Decrypt the message using the secret key
      this.message = this.cryptoService.decryptMessage(secretMessage.encryptedMessage, this.secretKey);
      this.durationInSeconds = secretMessage.durationInSeconds;

      console.log('Decrypted message:', this.message);

      // Set up auto-redirect after duration
      if (this.durationInSeconds > 0) {
        setTimeout(() => {
          this.router.navigate(['/secret-message-generate']);
        }, this.durationInSeconds * 1_000);
      }
    } catch (error) {
      console.error('Error reading secret message:', error);
      this.router.navigate(['/secret-message-generate']);
    } finally {
      this.loaderService.hide();
    }
  }
}
