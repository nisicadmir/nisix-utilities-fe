import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../theme.service';
import { FirestoreService } from '../_firestore/firestore.service';

interface SnakePlayer {
  name: string;
  score: number;
  joinedAt: any;
}

interface SnakeGame {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  players: { [key: string]: SnakePlayer };
  highScore: number;
  highScorePlayerName: string;
  startTime?: Date;
  endTime?: Date;
  createdAt?: Date;
}

@Component({
  selector: 'app-snake-game',
  templateUrl: './snake-game.component.html',
  styleUrls: ['./snake-game.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule],
  standalone: true,
})
export class SnakeGameComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private snake: { x: number; y: number }[] = [];
  private food: { x: number; y: number } = { x: 0, y: 0 };
  private direction: 'up' | 'down' | 'left' | 'right' = 'right';
  private gridSize = 20;
  private gameInterval: any;

  // Speed-related properties
  private initialGameSpeed = 50; // Starting speed (slower)
  private currentGameSpeed = this.initialGameSpeed;
  private minGameSpeed = 5; // Maximum speed (faster)
  private speedIncreasePerFood = 5; // How much to decrease the interval per food eaten
  private speedIncreaseThreshold = 2; // How many foods to eat before increasing speed

  isGameStarted = false;
  score = 0;
  gameOver = false;

  // Online mode properties
  onlineMode = false;
  gameId: string | null = null;
  playerId: string | null = null;
  gameData: SnakeGame | null = null;
  timeRemainingString = '03:00';
  private gameSubscription: any;
  private timerInterval: any;
  gameStatus: 'waiting' | 'playing' | 'finished' = 'waiting';

  isDarkTheme = false;
  private themeSubscription: any;

  constructor(
    private themeService: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
    private firestoreService: FirestoreService,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard,
  ) {}

  ngOnInit() {
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe((isDark) => {
      this.isDarkTheme = isDark;
      if (this.ctx) this.draw(); // Redraw immediately on theme change
    });

    this.route.params.subscribe((params) => {
      const id = params['id'];
      // Only join if we have an ID and it's different from current (or we aren't joined yet)
      if (id) {
        if (this.gameId !== id) {
          this.gameId = id;
          this.joinGame(this.gameId!);
        }
      } else {
        // Reset online mode if no ID (e.g. navigating back)
        this.onlineMode = false;
        this.gameId = null;
        this.playerId = null;
        this.gameData = null;
        this.gameStatus = 'waiting';
        if (this.gameSubscription) {
          this.gameSubscription();
          this.gameSubscription = null;
        }
        // Clean up localStorage entries older than 1 hour
        this.cleanupOldGameEntries();
      }
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.gameSubscription) {
      this.gameSubscription();
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }
  }

  private setupCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = 400;
    canvas.height = 400;
  }

  private cleanupOldGameEntries() {
    // Clean up localStorage entries for snake games (optional cleanup)
    // This is a simple implementation - you could add timestamps if needed
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('snake_game_player_')) {
        // Could add timestamp check here, but for now just leave them
        // They'll be overwritten if same gameId is used
      }
    });
  }

  async startOnlineGame() {
    try {
      const playerName = 'Player ' + Math.floor(Math.random() * 1000);
      const { gameId, playerId } = await this.firestoreService.createSnakeGame(playerName);
      this.playerId = playerId;
      this.onlineMode = true;
      // Store playerId in localStorage so we can retrieve it after navigation
      localStorage.setItem(`snake_game_player_${gameId}`, playerId);
      this.router.navigate(['/snake-game', gameId]);
    } catch (error) {
      console.error('Error starting online game:', error);
      this.snackBar.open('Error starting game', 'Close', { duration: 3000 });
    }
  }

  async joinGame(gameId: string) {
    try {
      // Check localStorage first - if we created this game, we already have a playerId
      const storedPlayerId = localStorage.getItem(`snake_game_player_${gameId}`);

      if (storedPlayerId) {
        // We already created/joined this game, just use the stored playerId
        this.playerId = storedPlayerId;
        this.onlineMode = true;
        this.subscribeToGame(gameId);
        return;
      }

      // If we already have a playerId in memory (e.g. from createSnakeGame), don't join again
      if (this.playerId) {
        // Store it for future reference
        localStorage.setItem(`snake_game_player_${gameId}`, this.playerId);
        this.subscribeToGame(gameId);
        return;
      }

      // New player joining - call joinSnakeGame
      const playerName = 'Player ' + Math.floor(Math.random() * 1000);
      const { playerId } = await this.firestoreService.joinSnakeGame(gameId, playerName);
      this.playerId = playerId;
      this.onlineMode = true;
      // Store for future reference
      localStorage.setItem(`snake_game_player_${gameId}`, playerId);
      this.subscribeToGame(gameId);
    } catch (error) {
      console.error('Error joining game:', error);
      this.snackBar.open('Error joining game', 'Close', { duration: 3000 });
      this.router.navigate(['/snake-game']);
    }
  }

  shareGame() {
    const url = window.location.href;
    this.clipboard.copy(url);
    this.snackBar.open('Game link copied to clipboard!', 'Close', { duration: 3000 });
  }

  private subscribeToGame(gameId: string) {
    this.gameSubscription = this.firestoreService.subscribeToSnakeGame(gameId, (game) => {
      if (!game) {
        this.snackBar.open('Game not found', 'Close', { duration: 3000 });
        this.router.navigate(['/snake-game']);
        return;
      }

      this.gameData = game;
      this.gameStatus = game.status;

      if (game.status === 'playing' && game.endTime) {
        this.startTimer(game.endTime);
      } else if (game.status === 'finished') {
        this.timeRemainingString = '00:00';
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.isGameStarted) this.endGame();
      }
    });
  }

  private startTimer(endTime: Date) {
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Check if both players are joined, logic usually handled by backend status
    // Status changes to 'playing' only when 2nd player joins, so this is implicitly correct
    // But to be safe, we only run this if status is playing
    if (this.gameStatus !== 'playing') return;

    this.timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const diff = end - now;

      if (diff <= 0) {
        this.timeRemainingString = '00:00';
        clearInterval(this.timerInterval);
        // Time is up!
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        this.timeRemainingString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  startGame() {
    if (this.onlineMode) {
      if (this.gameStatus !== 'playing') {
        if (this.gameStatus === 'waiting') {
          this.snackBar.open('Waiting for other player to join...', 'Close', { duration: 2000 });
        } else if (this.gameStatus === 'finished') {
          this.snackBar.open('Game finished!', 'Close', { duration: 2000 });
        }
        return;
      }
      // If playing, allow start (restart after death)
    }

    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }
    this.isGameStarted = true;
    this.gameOver = false;
    this.score = 0;
    this.direction = 'right';
    this.currentGameSpeed = this.initialGameSpeed; // Reset speed to initial
    this.initializeSnake();
    this.generateFood();
    this.startGameInterval();

    // Sync initial score
    if (this.onlineMode && this.gameId && this.playerId) {
      this.firestoreService.updateSnakeScore(this.gameId, this.playerId, 0);
    }
  }

  private startGameInterval() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }
    this.gameInterval = setInterval(() => this.gameLoop(), this.currentGameSpeed);
  }

  private updateGameSpeed() {
    // Only increase speed every speedIncreaseThreshold foods eaten
    if (this.score % (this.speedIncreaseThreshold * 10) === 0) {
      // Calculate new speed
      const newSpeed = Math.max(this.minGameSpeed, this.currentGameSpeed - this.speedIncreasePerFood);

      // Only update if the speed actually changed
      if (newSpeed !== this.currentGameSpeed) {
        this.currentGameSpeed = newSpeed;
        this.startGameInterval(); // Restart interval with new speed
        console.log(`Speed increased! Current interval: ${this.currentGameSpeed}ms`);
      }
    }
  }

  private initializeSnake() {
    // Start with a snake of length 3
    this.snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ];
  }

  private generateFood() {
    const canvas = this.canvasRef.nativeElement;
    const maxX = canvas.width / this.gridSize - 1;
    const maxY = canvas.height / this.gridSize - 1;

    do {
      this.food = {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY),
      };
    } while (this.snake.some((segment) => segment.x === this.food.x && segment.y === this.food.y));
  }

  private gameLoop() {
    if (!this.isGameStarted || this.gameOver) {
      return;
    }

    const newHead = { ...this.snake[0] };

    // Move the snake
    switch (this.direction) {
      case 'up':
        newHead.y--;
        break;
      case 'down':
        newHead.y++;
        break;
      case 'left':
        newHead.x--;
        break;
      case 'right':
        newHead.x++;
        break;
    }

    // Check for collisions
    if (this.checkCollision(newHead)) {
      this.endGame();
      return;
    }

    // Add new head
    this.snake.unshift(newHead);

    // Check if food is eaten
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10;
      this.generateFood();
      this.updateGameSpeed(); // Update speed when food is eaten

      // Update score online
      if (this.onlineMode && this.gameId && this.playerId) {
        this.firestoreService.updateSnakeScore(this.gameId, this.playerId, this.score);
      }
    } else {
      // Remove tail if food wasn't eaten
      this.snake.pop();
    }

    this.draw();
  }

  private checkCollision(head: { x: number; y: number }): boolean {
    const canvas = this.canvasRef.nativeElement;
    const maxX = canvas.width / this.gridSize - 1;
    const maxY = canvas.height / this.gridSize - 1;

    // Wall collision
    if (head.x < 0 || head.x > maxX || head.y < 0 || head.y > maxY) {
      return true;
    }

    // Self collision
    return this.snake.some((segment) => segment.x === head.x && segment.y === head.y);
  }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    // We need to subscribe or get the value of the observable.
    // Since we're in a loop, subscribing is bad.
    // We should probably have a local property updated by subscription, or just check DOM/Service state if sync.
    // Assuming themeService.isDarkTheme$ is a behavior subject or we can use a trick.
    // Actually, let's just look at the body class or assume a default passed in or use a wrapper.
    // For now, let's use a safe default or check a property we sync.
    // Ideally we sync `isDark` in ngOnInit.

    // Fix: use a local property that syncs with the observable
    const isDark = this.isDarkTheme;

    // Background
    this.ctx.fillStyle = isDark ? '#1a1a1a' : '#fff';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    this.ctx.strokeStyle = isDark ? '#444' : '#ddd';
    this.ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    this.snake.forEach((segment, index) => {
      this.ctx.fillStyle = index === 0 ? '#4CAF50' : '#388E3C';
      this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
    });

    // Draw food
    this.ctx.fillStyle = '#FF5252';
    this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
  }

  private endGame() {
    this.gameOver = true;
    this.isGameStarted = false;
    clearInterval(this.gameInterval);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);

    // Start or restart the game if an arrow key is pressed
    if (!this.isGameStarted && isArrowKey) {
      this.startGame();
      // Set initial direction based on the pressed key
      switch (event.key) {
        case 'ArrowUp':
          this.direction = 'up';
          break;
        case 'ArrowDown':
          this.direction = 'down';
          break;
        case 'ArrowLeft':
          this.direction = 'left';
          break;
        case 'ArrowRight':
          this.direction = 'right';
          break;
        case ' ': // Space bar to restart/start
          this.startGame();
          break;
      }
      return;
    }

    // Handle direction changes during gameplay
    if (!this.isGameStarted) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        if (this.direction !== 'down') this.direction = 'up';
        break;
      case 'ArrowDown':
        if (this.direction !== 'up') this.direction = 'down';
        break;
      case 'ArrowLeft':
        if (this.direction !== 'right') this.direction = 'left';
        break;
      case 'ArrowRight':
        if (this.direction !== 'left') this.direction = 'right';
        break;
    }
  }
}
