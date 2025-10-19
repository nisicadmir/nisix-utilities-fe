import { Component } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-base64-utility',
  imports: [
    MenuComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './base64-utility.component.html',
  styleUrl: './base64-utility.component.scss',
})
export class Base64UtilityComponent {
  formGroupFrmBase64Encoder: FormGroup;
  formGroupFrmBase64Decoder: FormGroup;

  encodedResult: string = '';
  decodedResult: string = '';
  hasEncodedResult: boolean = false;
  hasDecodedResult: boolean = false;

  constructor(private formBuilder: FormBuilder, private utilService: UtilService) {
    this.formGroupFrmBase64Encoder = this.formBuilder.group({
      textToEncode: ['', [Validators.required]],
    });

    this.formGroupFrmBase64Decoder = this.formBuilder.group({
      textToDecode: ['', [Validators.required]],
    });
  }

  public encodeToBase64(): void {
    const text = this.formGroupFrmBase64Encoder.value.textToEncode;

    try {
      this.encodedResult = btoa(unescape(encodeURIComponent(text)));
      this.hasEncodedResult = true;
    } catch (error) {
      this.utilService.showError('Error encoding text to Base64');
    }
  }

  public decodeFromBase64(): void {
    const text = this.formGroupFrmBase64Decoder.value.textToDecode;

    try {
      this.decodedResult = decodeURIComponent(escape(atob(text)));
      this.hasDecodedResult = true;
    } catch (error) {
      this.utilService.showError('Error decoding Base64 text. Please check if the input is valid Base64.');
    }
  }

  public copyToClipboard(text: string) {
    this.utilService.copyToClipboard(text);
  }

  public clearEncoder(): void {
    this.formGroupFrmBase64Encoder.reset();
    this.encodedResult = '';
    this.hasEncodedResult = false;
  }

  public clearDecoder(): void {
    this.formGroupFrmBase64Decoder.reset();
    this.decodedResult = '';
    this.hasDecodedResult = false;
  }
}
