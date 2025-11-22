import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LoaderService } from '../_modules/loader/loader.service';
import { FirestoreService } from '../_firestore/firestore.service';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-chat-room-create',
  imports: [MatButtonModule],
  templateUrl: './chat-room-create.component.html',
  styleUrl: './chat-room-create.component.scss',
})
export class ChatRoomCreateComponent {
  constructor(
    private firestoreService: FirestoreService,
    private router: Router,
    private loaderService: LoaderService,
    private utilService: UtilService,
  ) {}

  async createRoom(): Promise<void> {
    this.loaderService.show();
    try {
      const { roomId, participantName } = await this.firestoreService.createChatRoom();

      // Store participant name in sessionStorage
      sessionStorage.setItem(`chat_room_${roomId}_participant`, participantName);

      // Navigate to chat room
      this.router.navigate(['/chat-room', roomId]);
    } catch (error) {
      console.error('Error creating room:', error);
      this.utilService.showError('Failed to create room. Please try again.');
    } finally {
      this.loaderService.hide();
    }
  }
}
