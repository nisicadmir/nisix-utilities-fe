import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-snake-game',
  templateUrl: './snake-game.component.html',
  styleUrls: ['./snake-game.component.scss'],
  imports: [MatButtonModule],
  standalone: true,
})
export class SnakeGameComponent implements AfterViewInit {
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

  constructor(private themeService: ThemeService) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = 400;
    canvas.height = 400;
  }

  startGame() {
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
    this.ctx.fillStyle = this.themeService.isDarkTheme$ ? '#fff' : '#1a1a1a'; // Dark background
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    this.snake.forEach((segment, index) => {
      this.ctx.fillStyle = index === 0 ? '#4CAF50' : '#388E3C'; // Head is lighter green
      this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
    });

    // Draw food
    this.ctx.fillStyle = this.themeService.isDarkTheme$ ? '#FF5252' : '#000'; // Red food
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
