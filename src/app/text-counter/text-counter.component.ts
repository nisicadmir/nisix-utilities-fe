import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-text-counter',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    DecimalPipe,
    PercentPipe,
  ],
  templateUrl: './text-counter.component.html',
  styleUrl: './text-counter.component.scss',
})
export class TextCounterComponent {
  formGroupFrmTextCounter: FormGroup;

  characterCount: number = 0;
  characterCountWithoutSpaces: number = 0;
  wordCount: number = 0;

  constructor(private formBuilder: FormBuilder) {
    this.formGroupFrmTextCounter = this.formBuilder.group({
      textInput: [''],
    });

    // Subscribe to text changes to update counts in real-time
    this.formGroupFrmTextCounter.get('textInput')?.valueChanges.subscribe((text) => {
      this.updateCounts(text || '');
    });
  }

  private updateCounts(text: string): void {
    // Character count (including spaces)
    this.characterCount = text.length;

    // Character count without spaces
    this.characterCountWithoutSpaces = text.replace(/\s/g, '').length;

    // Word count (split by whitespace and filter out empty strings)
    this.wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  }

  public getAverageWordLength(): number {
    if (this.wordCount === 0) return 0;
    return this.characterCountWithoutSpaces / this.wordCount;
  }

  public getReadingTime(): number {
    // Average reading speed: 200 words per minute
    return Math.ceil(this.wordCount / 200);
  }

  public getSpaceRatio(): number {
    if (this.characterCount === 0) return 0;
    return (this.characterCount - this.characterCountWithoutSpaces) / this.characterCount;
  }
}
