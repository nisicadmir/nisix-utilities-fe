import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
@Injectable({
  providedIn: 'root',
})
export class UtilService {
  constructor(private snackBar: MatSnackBar) {}

  public copyToClipboard(text: string | number) {
    navigator.clipboard.writeText(text.toString());
    this.snackBar.open('Copied to clipboard', 'Close', {
      duration: 3000,
    });
  }
}
