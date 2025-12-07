import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor() { }

  success(message: string): void {
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
