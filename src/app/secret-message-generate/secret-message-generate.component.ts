import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-secret-message-generate',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './secret-message-generate.component.html',
  styleUrl: './secret-message-generate.component.scss',
})
export class SecretMessageGenerateComponent {
  formGroup = new FormGroup({
    message: new FormControl('', [Validators.required]),
  });

  public generateSecretMessage() {
    console.log(this.formGroup.value);
  }
}
