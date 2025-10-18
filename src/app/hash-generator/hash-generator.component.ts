import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import * as CryptoJS from 'crypto-js';
import { MenuComponent } from '../menu/menu.component';
import { ThemeService } from '../theme.service';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-hash-generator',
  imports: [
    MenuComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './hash-generator.component.html',
  styleUrl: './hash-generator.component.scss',
})
export class HashGeneratorComponent {
  formGroupFrmHashGenerator: FormGroup;
  generatedHashes: { [key: string]: string } = {};

  isDarkTheme$ = this.themeService.isDarkTheme$;

  hashAlgorithms = [
    { value: 'md5', label: 'MD5' },
    { value: 'sha1', label: 'SHA1' },
    { value: 'sha256', label: 'SHA256' },
    { value: 'sha512', label: 'SHA512' },
  ];

  constructor(private formBuilder: FormBuilder, private utilService: UtilService, private themeService: ThemeService) {
    this.formGroupFrmHashGenerator = this.formBuilder.group({
      inputText: ['', [Validators.required]],
      selectedAlgorithm: ['all', [Validators.required]],
    });
  }

  public generateHashes(): void {
    const inputText = this.formGroupFrmHashGenerator.value.inputText;
    const selectedAlgorithm = this.formGroupFrmHashGenerator.value.selectedAlgorithm;

    this.generatedHashes = {};

    if (selectedAlgorithm === 'all') {
      this.hashAlgorithms.forEach((algorithm) => {
        this.generatedHashes[algorithm.value] = this.generateHash(inputText, algorithm.value);
      });
    } else {
      this.generatedHashes[selectedAlgorithm] = this.generateHash(inputText, selectedAlgorithm);
    }
  }

  private generateHash(text: string, algorithm: string): string {
    switch (algorithm) {
      case 'md5':
        return CryptoJS.MD5(text).toString();
      case 'sha1':
        return CryptoJS.SHA1(text).toString();
      case 'sha256':
        return CryptoJS.SHA256(text).toString();
      case 'sha512':
        return CryptoJS.SHA512(text).toString();
      default:
        return '';
    }
  }

  public copyToClipboard(text: string | number) {
    this.utilService.copyToClipboard(text);
  }

  public get hasGeneratedHashes(): boolean {
    return Object.keys(this.generatedHashes).length > 0;
  }
}
