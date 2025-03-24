import { Component } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-password-generator',
  imports: [
    MenuComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './password-generator.component.html',
  styleUrl: './password-generator.component.scss',
})
export class PasswordGeneratorComponent {
  formGroupFrmPasswordGenerator: FormGroup;

  generatedPassword: string = '';

  constructor(private formBuilder: FormBuilder, private utilService: UtilService) {
    this.formGroupFrmPasswordGenerator = this.formBuilder.group({
      length: [20, [Validators.required, Validators.min(10), Validators.max(50)]],
      includeSpecialCharacters: [false],
    });
  }

  public generatePassword(): void {
    const length = this.formGroupFrmPasswordGenerator.value.length;
    const includeSpecial = this.formGroupFrmPasswordGenerator.value.includeSpecialCharacters;

    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    if (includeSpecial) {
      chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    this.generatedPassword = Array(length)
      .fill(null)
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join('');
  }

  public copyToClipboard(text: string | number) {
    this.utilService.copyToClipboard(text);
  }
}
