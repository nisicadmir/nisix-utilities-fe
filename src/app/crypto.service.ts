import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  /**
   * Generate a random key between 30-50 characters
   */
  generateRandomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 21) + 30; // 30-50 chars
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /**
   * Encrypt a message with the given key
   */
  encryptMessage(message: string, key: string): string {
    return CryptoJS.AES.encrypt(message, key).toString();
  }

  /**
   * Decrypt a message with the given key
   */
  decryptMessage(encryptedMessage: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
