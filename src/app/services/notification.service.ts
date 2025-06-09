import { Injectable } from '@angular/core';
// You might integrate a library like Notyf, ngx-toastr, or Angular Material Snackbar

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor() {}

  success(message: string): void {
    // Replace with actual toast/snackbar implementation
    console.log(`SUCCESS: ${message}`);
    alert(`SUCCESS: ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`ERROR: ${message}`, error);
    alert(`ERROR: ${message}`);
  }

  info(message: string): void {
    console.log(`INFO: ${message}`);
    alert(`INFO: ${message}`);
  }
}