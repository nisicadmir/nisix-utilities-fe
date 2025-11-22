import { Component, OnDestroy, OnInit, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FirestoreService, ChatRoom, ChatMessage } from '../_firestore/firestore.service';
import { UtilService } from '../util.service';
import { LoaderService } from '../_modules/loader/loader.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-chat-room',
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  roomId: string = '';
  participantName: string = '';
  room: ChatRoom | null = null;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  roomLink: string = '';

  private roomUnsubscribe: (() => void) | null = null;
  private messagesUnsubscribe: (() => void) | null = null;
  private shouldScrollToBottom: boolean = false;
  private joinTimestamp: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestoreService: FirestoreService,
    private utilService: UtilService,
    private loaderService: LoaderService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';

    if (!this.roomId) {
      this.utilService.showError('Invalid room ID');
      this.router.navigate(['/chat-room-create']);
      return;
    }

    // Check if participant name exists in sessionStorage (for creator)
    const storedParticipant = sessionStorage.getItem(`chat_room_${this.roomId}_participant`);

    if (storedParticipant) {
      this.participantName = storedParticipant;
      // Set join timestamp to current time for creator (will be updated when room loads)
      this.joinTimestamp = new Date();
      this.setupRoom();
    } else {
      // Try to join the room
      await this.joinRoom();
    }
  }

  private async joinRoom(): Promise<void> {
    this.loaderService.show();
    try {
      const result = await this.firestoreService.joinChatRoom(this.roomId);
      this.participantName = result.participantName;
      sessionStorage.setItem(`chat_room_${this.roomId}_participant`, this.participantName);
      // Set join timestamp to current time (will be updated when room loads with exact timestamp)
      this.joinTimestamp = new Date();
      this.setupRoom();
    } catch (error: any) {
      console.error('Error joining room:', error);
      this.utilService.showError(error.message || 'Failed to join room');
      this.router.navigate(['/chat-room-create']);
    } finally {
      this.loaderService.hide();
    }
  }

  private setupRoom(): void {
    this.roomLink = `${environment.url}/chat-room/${this.roomId}`;

    // Subscribe to room updates
    this.roomUnsubscribe = this.firestoreService.subscribeToChatRoom(this.roomId, (room) => {
      if (!room) {
        // Room was deleted/closed
        this.utilService.showError('Room has been closed');
        this.router.navigate(['/chat-room-create']);
        return;
      }

      this.room = room;

      // Set join timestamp if not already set
      if (!this.joinTimestamp && this.participantName) {
        const participant = room.participants.find((p) => p.name === this.participantName);
        if (participant && participant.joinedAt) {
          // Convert Firestore timestamp to Date
          this.joinTimestamp = participant.joinedAt.toDate ? participant.joinedAt.toDate() : new Date(participant.joinedAt);
        } else {
          // Fallback to current time if participant not found (shouldn't happen)
          this.joinTimestamp = new Date();
        }
      }

      // Check if room expired
      if (room.expiresAt < new Date()) {
        this.utilService.showError('Room has expired');
        this.router.navigate(['/chat-room-create']);
        return;
      }

      // Check if room is closed
      if (room.status === 'closed') {
        this.utilService.showError('Room has been closed');
        this.router.navigate(['/chat-room-create']);
        return;
      }

      // Trigger change detection
      this.cdr.detectChanges();
    });

    // Subscribe to messages
    this.messagesUnsubscribe = this.firestoreService.subscribeToChatMessages(this.roomId, (messages) => {
      // Filter messages to only show those sent after join time
      let filteredMessages = messages;
      if (this.joinTimestamp) {
        filteredMessages = messages.filter((message) => {
          if (!message.timestamp) return false;
          const messageTime = message.timestamp.toDate ? message.timestamp.toDate() : new Date(message.timestamp);
          return messageTime >= this.joinTimestamp!;
        });
      }

      const wasAtBottom = this.isScrolledToBottom();
      const previousMessagesCount = this.messages.length;
      this.messages = filteredMessages;
      // Scroll to bottom if user was already at bottom or if it's a new message
      if (wasAtBottom || filteredMessages.length > previousMessagesCount) {
        this.shouldScrollToBottom = true;
      }

      // Trigger change detection
      this.cdr.detectChanges();
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim()) {
      return;
    }

    if (!this.room || this.room.status !== 'active') {
      this.utilService.showError('Room is not active');
      return;
    }

    if (this.room.expiresAt < new Date()) {
      this.utilService.showError('Room has expired');
      return;
    }

    try {
      await this.firestoreService.sendChatMessage(this.roomId, this.participantName, this.newMessage.trim());
      this.newMessage = '';
      // Scroll to bottom after sending message
      this.shouldScrollToBottom = true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      this.utilService.showError(error.message || 'Failed to send message');
    }
  }

  private isScrolledToBottom(): boolean {
    if (!this.messagesContainer) {
      return true;
    }
    const element = this.messagesContainer.nativeElement;
    const threshold = 100; // 100px threshold
    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      } catch (err) {
        console.error('Error scrolling to bottom:', err);
      }
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      setTimeout(() => {
        this.scrollToBottom();
        this.shouldScrollToBottom = false;
      }, 0);
    }
  }

  shareRoom(): void {
    this.utilService.copyToClipboard(this.roomLink);
  }

  async deleteAllMessages(): Promise<void> {
    if (!confirm('Are you sure you want to delete all messages? This action cannot be undone.')) {
      return;
    }

    try {
      await this.firestoreService.deleteAllChatMessages(this.roomId);
      this.utilService.showError('All messages deleted');
    } catch (error: any) {
      console.error('Error deleting messages:', error);
      this.utilService.showError(error.message || 'Failed to delete messages');
    }
  }

  async closeRoom(): Promise<void> {
    if (!confirm('Are you sure you want to close the room? This will kick everyone out and delete the room.')) {
      return;
    }

    try {
      await this.firestoreService.closeChatRoom(this.roomId);
      this.utilService.showError('Room closed');
      this.router.navigate(['/chat-room-create']);
    } catch (error: any) {
      console.error('Error closing room:', error);
      this.utilService.showError(error.message || 'Failed to close room');
    }
  }

  get participantCount(): number {
    return this.room?.participants?.length || 0;
  }

  get maxParticipants(): number {
    return this.room?.maxParticipants || 10;
  }

  isMyMessage(participantName: string): boolean {
    return participantName === this.participantName;
  }

  formatTimestamp(timestamp: any): string {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleString();
  }

  ngOnDestroy(): void {
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
    }
    if (this.messagesUnsubscribe) {
      this.messagesUnsubscribe();
    }
  }
}
