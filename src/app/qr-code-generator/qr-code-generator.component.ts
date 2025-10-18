import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MenuComponent } from '../menu/menu.component';
import { UtilService } from '../util.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code-generator',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MenuComponent,
  ],
  templateUrl: './qr-code-generator.component.html',
  styleUrl: './qr-code-generator.component.scss',
})
export class QrCodeGeneratorComponent {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  qrForm: FormGroup;
  qrCodeDataUrl: string = '';
  isGenerating: boolean = false;

  qrTypes = [
    { value: 'text', label: 'Plain Text' },
    { value: 'url', label: 'URL' },
    { value: 'wifi', label: 'WiFi Network' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'sms', label: 'SMS' },
    { value: 'vcard', label: 'Contact Card (vCard)' },
  ];

  constructor(private formBuilder: FormBuilder, private utilService: UtilService, private snackBar: MatSnackBar) {
    this.qrForm = this.formBuilder.group({
      type: ['text', Validators.required],
      text: ['', Validators.required],
      // WiFi specific fields
      ssid: [''],
      password: [''],
      security: ['WPA'],
      hidden: [false],
      // Email specific fields
      email: [''],
      subject: [''],
      body: [''],
      // Phone specific fields
      phone: [''],
      // SMS specific fields
      smsPhone: [''],
      smsMessage: [''],
      // vCard specific fields
      firstName: [''],
      lastName: [''],
      organization: [''],
      title: [''],
      phoneWork: [''],
      phoneMobile: [''],
      emailWork: [''],
      website: [''],
      address: [''],
      city: [''],
      state: [''],
      zip: [''],
      country: [''],
    });

    // Watch for type changes to update validation
    this.qrForm.get('type')?.valueChanges.subscribe((type) => {
      this.updateFormValidation(type);
    });

    // Initialize validation for default type
    this.updateFormValidation('text');
  }

  private updateFormValidation(type: string) {
    // Reset all validators
    Object.keys(this.qrForm.controls).forEach((key) => {
      this.qrForm.get(key)?.clearValidators();
    });

    // Set required validators based on type
    switch (type) {
      case 'text':
        this.qrForm.get('text')?.setValidators([Validators.required]);
        break;
      case 'url':
        this.qrForm.get('text')?.setValidators([Validators.required]);
        break;
      case 'wifi':
        this.qrForm.get('ssid')?.setValidators([Validators.required]);
        break;
      case 'email':
        this.qrForm.get('email')?.setValidators([Validators.required, Validators.email]);
        break;
      case 'phone':
        this.qrForm.get('phone')?.setValidators([Validators.required]);
        break;
      case 'sms':
        this.qrForm.get('smsPhone')?.setValidators([Validators.required]);
        this.qrForm.get('smsMessage')?.setValidators([Validators.required]);
        break;
      case 'vcard':
        this.qrForm.get('firstName')?.setValidators([Validators.required]);
        this.qrForm.get('lastName')?.setValidators([Validators.required]);
        break;
    }

    // Update validity only for non-type controls to avoid recursion
    Object.keys(this.qrForm.controls).forEach((key) => {
      if (key !== 'type') {
        this.qrForm.get(key)?.updateValueAndValidity();
      }
    });
  }

  async generateQRCode() {
    if (this.qrForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isGenerating = true;
    const type = this.qrForm.get('type')?.value;
    let qrData = '';

    try {
      switch (type) {
        case 'text':
          qrData = this.qrForm.get('text')?.value;
          break;
        case 'url':
          qrData = this.qrForm.get('text')?.value;
          break;
        case 'wifi':
          qrData = this.generateWiFiQR();
          break;
        case 'email':
          qrData = this.generateEmailQR();
          break;
        case 'phone':
          qrData = `tel:${this.qrForm.get('phone')?.value}`;
          break;
        case 'sms':
          qrData = this.generateSMSQR();
          break;
        case 'vcard':
          qrData = this.generateVCardQR();
          break;
      }

      // Generate QR code
      const canvas = this.qrCanvas.nativeElement;
      await QRCode.toCanvas(canvas, qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Convert canvas to data URL for download
      this.qrCodeDataUrl = canvas.toDataURL('image/png');

      this.snackBar.open('QR Code generated successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.snackBar.open('Error generating QR code', 'Close', { duration: 3000 });
    } finally {
      this.isGenerating = false;
    }
  }

  private generateWiFiQR(): string {
    const ssid = this.qrForm.get('ssid')?.value;
    const password = this.qrForm.get('password')?.value;
    const security = this.qrForm.get('security')?.value;
    const hidden = this.qrForm.get('hidden')?.value;

    return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
  }

  private generateEmailQR(): string {
    const email = this.qrForm.get('email')?.value;
    const subject = this.qrForm.get('subject')?.value;
    const body = this.qrForm.get('body')?.value;

    let mailto = `mailto:${email}`;
    const params = [];

    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);

    if (params.length > 0) {
      mailto += `?${params.join('&')}`;
    }

    return mailto;
  }

  private generateSMSQR(): string {
    const phone = this.qrForm.get('smsPhone')?.value;
    const message = this.qrForm.get('smsMessage')?.value;

    return `sms:${phone}:${encodeURIComponent(message)}`;
  }

  private generateVCardQR(): string {
    const firstName = this.qrForm.get('firstName')?.value;
    const lastName = this.qrForm.get('lastName')?.value;
    const organization = this.qrForm.get('organization')?.value;
    const title = this.qrForm.get('title')?.value;
    const phoneWork = this.qrForm.get('phoneWork')?.value;
    const phoneMobile = this.qrForm.get('phoneMobile')?.value;
    const emailWork = this.qrForm.get('emailWork')?.value;
    const website = this.qrForm.get('website')?.value;
    const address = this.qrForm.get('address')?.value;
    const city = this.qrForm.get('city')?.value;
    const state = this.qrForm.get('state')?.value;
    const zip = this.qrForm.get('zip')?.value;
    const country = this.qrForm.get('country')?.value;

    let vcard = 'BEGIN:VCARD\n';
    vcard += 'VERSION:3.0\n';
    vcard += `FN:${firstName} ${lastName}\n`;
    vcard += `N:${lastName};${firstName};;;\n`;

    if (organization) vcard += `ORG:${organization}\n`;
    if (title) vcard += `TITLE:${title}\n`;
    if (phoneWork) vcard += `TEL;TYPE=WORK:${phoneWork}\n`;
    if (phoneMobile) vcard += `TEL;TYPE=CELL:${phoneMobile}\n`;
    if (emailWork) vcard += `EMAIL:${emailWork}\n`;
    if (website) vcard += `URL:${website}\n`;

    if (address || city || state || zip || country) {
      vcard += `ADR:;;${address || ''};${city || ''};${state || ''};${zip || ''};${country || ''}\n`;
    }

    vcard += 'END:VCARD';
    return vcard;
  }

  downloadQRCode() {
    if (!this.qrCodeDataUrl) {
      this.snackBar.open('Please generate a QR code first', 'Close', { duration: 3000 });
      return;
    }

    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = this.qrCodeDataUrl;
    link.click();
  }

  copyQRCodeData() {
    if (!this.qrCodeDataUrl) {
      this.snackBar.open('Please generate a QR code first', 'Close', { duration: 3000 });
      return;
    }

    this.utilService.copyToClipboard(this.qrCodeDataUrl);
    this.snackBar.open('QR Code data copied to clipboard', 'Close', { duration: 3000 });
  }

  clearForm() {
    this.qrForm.reset();
    this.qrForm.patchValue({ type: 'text' });
    this.qrCodeDataUrl = '';
    const canvas = this.qrCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
