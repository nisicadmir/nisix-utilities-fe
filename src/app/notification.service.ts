import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  public showNotification(
    message: string,
    horizontalPosition: 'center' | 'left' | 'right' = 'center',
    verticalPosition: 'top' | 'bottom' = 'bottom',
  ) {
    this.snackBar.open(message, undefined, {
      duration: 3000,
      horizontalPosition: horizontalPosition,
      verticalPosition: verticalPosition,
    });
  }
}
