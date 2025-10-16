import { Injectable } from '@angular/core';
import { collection, addDoc, doc, getDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase.config';

export interface SecretMessage {
  id: string;
  encryptedMessage: string;
  durationInSeconds: number;
  createdAt: any;
  expiresAt: Date; // Auto-expire after 1 hour if not read
  readAt?: Date; // When the message was first read
}

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private readonly COLLECTION_NAME = 'secret_messages';

  /**
   * Store an encrypted message in Firestore
   */
  async storeMessage(encryptedMessage: string, durationInSeconds: number): Promise<{ messageId: string; secretKey: string }> {
    try {
      // Auto-expire after 1 hour if not read
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        encryptedMessage,
        durationInSeconds,
        createdAt: serverTimestamp(),
        expiresAt,
        readAt: null, // Not read yet
      });

      // Generate a random key for encryption/decryption
      const secretKey = this.generateRandomKey();

      return {
        messageId: docRef.id,
        secretKey,
      };
    } catch (error) {
      console.error('Error storing message:', error);
      throw error;
    }
  }

  /**
   * Retrieve a message from Firestore
   */
  async getMessage(messageId: string): Promise<SecretMessage | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, messageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        const message: SecretMessage = {
          id: docSnap.id,
          encryptedMessage: data['encryptedMessage'],
          durationInSeconds: data['durationInSeconds'],
          createdAt: data['createdAt'],
          expiresAt: data['expiresAt'].toDate(),
          readAt: data['readAt'] ? data['readAt'].toDate() : undefined,
        };

        // Check if message has auto-expired (1 hour limit)
        if (message.expiresAt < new Date()) {
          await this.deleteMessage(messageId);
          return null;
        }

        return message;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error retrieving message:', error);
      throw error;
    }
  }

  /**
   * Mark message as read and delete it immediately
   */
  async markAsReadAndDelete(messageId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, messageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error marking message as read and deleting:', error);
      throw error;
    }
  }

  /**
   * Delete a message from Firestore
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, messageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Clean up expired messages (optional utility method)
   */
  async cleanupExpiredMessages(): Promise<void> {
    try {
      const now = new Date();
      const q = query(collection(db, this.COLLECTION_NAME), where('expiresAt', '<', now));

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up expired messages:', error);
      throw error;
    }
  }

  /**
   * Generate a random key between 30-50 characters
   */
  private generateRandomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 21) + 30; // 30-50 chars
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
