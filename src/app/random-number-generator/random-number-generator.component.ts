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
  selector: 'app-random-number-generator',
  imports: [
    MenuComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './random-number-generator.component.html',
  styleUrl: './random-number-generator.component.scss',
})
export class RandomNumberGeneratorComponent {
  formGroupFrmRandomNumberGenerator: FormGroup;
  generatedNumbers: number[] = [];
  hasGeneratedNumbers: boolean = false;

  constructor(private formBuilder: FormBuilder, private utilService: UtilService) {
    this.formGroupFrmRandomNumberGenerator = this.formBuilder.group({
      minValue: [1, [Validators.required, Validators.min(-999999), Validators.max(999999)]],
      maxValue: [100, [Validators.required, Validators.min(-999999), Validators.max(999999)]],
      count: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      allowDuplicates: [false],
      integersOnly: [true],
    });
  }

  public generateRandomNumbers(): void {
    const min = this.formGroupFrmRandomNumberGenerator.value.minValue;
    const max = this.formGroupFrmRandomNumberGenerator.value.maxValue;
    const count = this.formGroupFrmRandomNumberGenerator.value.count;
    const allowDuplicates = this.formGroupFrmRandomNumberGenerator.value.allowDuplicates;
    const integersOnly = this.formGroupFrmRandomNumberGenerator.value.integersOnly;

    if (min >= max) {
      this.utilService.showError('Minimum value must be less than maximum value');
      return;
    }

    this.generatedNumbers = [];
    const usedNumbers = new Set<number>();

    for (let i = 0; i < count; i++) {
      let randomNumber: number;

      if (integersOnly) {
        randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        randomNumber = Math.random() * (max - min) + min;
      }

      if (!allowDuplicates && usedNumbers.has(randomNumber)) {
        i--; // Try again
        continue;
      }

      this.generatedNumbers.push(randomNumber);
      if (!allowDuplicates) {
        usedNumbers.add(randomNumber);
      }
    }

    this.hasGeneratedNumbers = true;
  }

  public copyToClipboard(text: string | number) {
    this.utilService.copyToClipboard(text);
  }

  public copyAllNumbers(): void {
    const numbersText = this.generatedNumbers.join(', ');
    this.utilService.copyToClipboard(numbersText);
  }
}
