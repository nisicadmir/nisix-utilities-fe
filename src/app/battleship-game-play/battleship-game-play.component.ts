import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';

import { environment } from '../../environments/environment';
import { MenuComponent } from '../menu/menu.component';
import { NotificationService } from '../notification.service';
import { LoaderService } from '../_modules/loader/loader.service';

interface IBattleshipGamePositions {
  carrier: Array<{ x: number; y: number }>;
  battleship: Array<{ x: number; y: number }>;
  cruiser: Array<{ x: number; y: number }>;
  submarine: Array<{ x: number; y: number }>;
  destroyer: Array<{ x: number; y: number }>;
}

enum BattleshipGameStatus {
  PENDING = 'pending',
  PENDING_POSITIONS = 'pending_positions', // Both players joined and set the battleship positions
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

interface IBattleshipGameMove {
  x: number;
  y: number;
  hit: boolean;
}

interface IBattleshipGameInfo {
  status: BattleshipGameStatus;
  playerIdTurn: string;

  playerIdWinner?: string;
  winnerMessage?: string;

  opponentName: string;

  positionsAreSet: boolean;
  opponentPositionsAreSet: boolean;

  positions: IBattleshipGamePositions;

  moves: IBattleshipGameMove[];
  opponentMoves: IBattleshipGameMove[];

  shipsSank: string[];
  opponentShipsSank: string[];
}

interface ShipInfo {
  name: keyof IBattleshipGamePositions;
  size: number;
}

type ShipType = keyof IBattleshipGamePositions;

@Component({
  selector: 'app-battleship-game-play',
  imports: [MenuComponent, MatButtonModule, MatInputModule, CommonModule, FormsModule],
  templateUrl: './battleship-game-play.component.html',
  styleUrl: './battleship-game-play.component.scss',
})
export class BattleshipGamePlayComponent {
  battleshipGameStatus = BattleshipGameStatus;
  battleshipGameId = '';
  playerId = '';
  playerName = '';
  playerPassword = '';

  battleshipGameInfo: IBattleshipGameInfo | null = null;

  gameIsReady = false;
  playerIdTurn = '';

  interval: ReturnType<typeof setInterval> | null = null;

  isInSettingPositions = false;

  // Ship placement order from largest to smallest
  ships: ShipInfo[] = [
    { name: 'carrier', size: 5 },
    { name: 'battleship', size: 4 },
    { name: 'cruiser', size: 3 },
    { name: 'submarine', size: 3 },
    { name: 'destroyer', size: 2 },
  ];

  currentShipIndex = 0;
  currentShip: ShipType = 'carrier';
  currentShipSize = 0;
  placementDirection: 'horizontal' | 'vertical' | null = null;

  battleshipPositions: IBattleshipGamePositions = {
    carrier: [],
    battleship: [],
    cruiser: [],
    submarine: [],
    destroyer: [],
  };

  // Grid: 0 = empty, 1 = current ship part, 2 = previous ship part, 3 = adjacent
  settingGrid: number[][] = Array(10)
    .fill(0)
    .map(() => Array(10).fill(0));

  myGrid: number[][] = Array(10)
    .fill(0)
    .map(() => Array(10).fill(0));

  opponentGrid: number[][] = Array(10)
    .fill(0)
    .map(() => Array(10).fill(0));

  winnerMessage = '';

  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private notificationService: NotificationService,
    private loaderService: LoaderService,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.battleshipGameId = params['battleshipGameId'];
      this.playerId = params['playerId'];
      this.playerPassword = params['playerPassword'];
    });
  }

  ngOnInit() {
    this.getBattleshipInfo(); // Initial fetch
    this.interval = setInterval(() => {
      this.getBattleshipInfo();
    }, 5_000);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  startSettingPositions() {
    this.resetGrid();
    this.currentShipIndex = 0;
    this.setCurrentShip();
    this.isInSettingPositions = true;
  }

  resetGrid() {
    this.settingGrid = Array(10)
      .fill(0)
      .map(() => Array(10).fill(0));
    this.battleshipPositions = {
      carrier: [],
      battleship: [],
      cruiser: [],
      submarine: [],
      destroyer: [],
    };
    this.placementDirection = null;
    this.currentShipIndex = 0;
    this.isInSettingPositions = false;
    this.setCurrentShip();
  }

  private setCurrentShip() {
    if (this.currentShipIndex < this.ships.length) {
      const shipInfo = this.ships[this.currentShipIndex];
      this.currentShip = shipInfo.name;
      this.currentShipSize = shipInfo.size;
    } else {
      // Handle case where all ships might already be placed or index is out of bounds
      this.isInSettingPositions = false;
    }
  }

  public onCellClick(row: number, col: number): void {
    if (!this.isInSettingPositions || !this.isValidClick(row, col)) {
      return;
    }

    const currentPositions = this.battleshipPositions[this.currentShip];

    // --- Placement Logic ---
    currentPositions.push({ x: row, y: col });
    this.settingGrid[row][col] = 1; // Mark as part of the current ship

    // Determine direction after second dot
    if (currentPositions.length === 2) {
      const firstDot = currentPositions[0];
      this.placementDirection = row === firstDot.x ? 'horizontal' : 'vertical';
    }

    // Check for ship completion
    if (currentPositions.length === this.currentShipSize) {
      this.finalizeCurrentShip();
    }
  }

  private isValidClick(row: number, col: number): boolean {
    // Basic checks: within grid and cell is empty
    if (row < 0 || row >= 10 || col < 0 || col >= 10 || this.settingGrid[row][col] !== 0) {
      return false;
    }

    const currentPositions = this.battleshipPositions[this.currentShip];

    // Check 1: First dot validation (just needs to be empty)
    if (currentPositions.length === 0) {
      return true; // Already checked grid[row][col] === 0
    }

    const lastDot = currentPositions[currentPositions.length - 1];

    // Check 2: Second dot validation (must be adjacent to the first)
    if (currentPositions.length === 1) {
      const isAdjacent = Math.abs(row - lastDot.x) + Math.abs(col - lastDot.y) === 1;
      return isAdjacent;
    }

    // Check 3: Subsequent dots validation (must follow direction)
    if (this.placementDirection === 'horizontal') {
      // Must be in same row, adjacent column
      return row === lastDot.x && Math.abs(col - lastDot.y) === 1;
    } else if (this.placementDirection === 'vertical') {
      // Must be in same column, adjacent row
      return col === lastDot.y && Math.abs(row - lastDot.x) === 1;
    }

    return false; // Should not happen if direction is set
  }

  private finalizeCurrentShip(): void {
    // Mark current ship parts as permanent (2)
    this.battleshipPositions[this.currentShip].forEach((pos) => {
      this.settingGrid[pos.x][pos.y] = 2;
    });

    // Mark adjacent cells (3)
    this.markAdjacentCells(this.battleshipPositions[this.currentShip]);

    // Move to the next ship
    this.currentShipIndex++;
    if (this.currentShipIndex < this.ships.length) {
      this.setCurrentShip();
      this.placementDirection = null; // Reset direction for the new ship
    } else {
      // All ships placed
      this.sendPositions(); // Send final positions to server
    }
  }

  private markAdjacentCells(shipPositions: Array<{ x: number; y: number }>): void {
    shipPositions.forEach((pos) => {
      for (let r = Math.max(0, pos.x - 1); r <= Math.min(9, pos.x + 1); r++) {
        for (let c = Math.max(0, pos.y - 1); c <= Math.min(9, pos.y + 1); c++) {
          if (this.settingGrid[r][c] === 0) {
            // Only mark empty cells
            this.settingGrid[r][c] = 3; // Mark as adjacent
          }
        }
      }
    });
  }

  clearPositions() {
    this.resetGrid();
  }

  getCellClass(row: number, col: number, gridType: 'setting' | 'myGrid' | 'opponentGrid' = 'setting'): string {
    const cellState =
      gridType === 'setting'
        ? this.settingGrid[row][col]
        : gridType === 'myGrid'
        ? this.myGrid[row][col]
        : this.opponentGrid[row][col];

    switch (cellState) {
      case 1:
        return 'ship-placing'; // Current ship being placed
      case 2:
        return 'ship-placed'; // Permanently placed ship
      case 3:
        return 'adjacent-to-ship'; // Adjacent/Blocked cell
      case 4:
        return 'hit'; // Hit cell
      case 5:
        return 'miss'; // Miss cell
      default: // Empty cell (0)
        if (this.isInSettingPositions && this.isValidClick(row, col)) {
          return 'valid-placement';
        }
        return ''; // Just an empty cell
    }
  }

  // --- http methods ---
  sendPositions() {
    // Prepare data for API: convert current positions object
    const finalPositions: Partial<IBattleshipGamePositions> = {};
    for (const shipName in this.battleshipPositions) {
      if (this.battleshipPositions.hasOwnProperty(shipName as ShipType)) {
        finalPositions[shipName as ShipType] = [...this.battleshipPositions[shipName as ShipType]];
      }
    }

    this.loaderService.show();

    this.httpClient
      .post<any>(`${environment.apiUrl}/battleship-game/${this.battleshipGameId}/set-ship-positions`, {
        playerId: this.playerId,
        playerPassword: this.playerPassword,
        positions: finalPositions,
      })
      .subscribe({
        next: (response) => {
          this.getBattleshipInfo(); // Refresh game info
          this.isInSettingPositions = false;
          this.loaderService.hide();
        },
        error: (error) => {
          console.error('Error setting positions:', error);
          this.loaderService.hide();
        },
        complete: () => {
          this.loaderService.hide();
        },
        // complete: () => { console.log('Position setting complete'); } // Optional
      });
  }

  makeMove(row: number, col: number) {
    if (this.playerIdTurn !== this.playerId) {
      this.notificationService.showNotification('It is not your turn');
      return;
    }

    this.loaderService.show();

    this.httpClient
      .post<{
        message: string;
        shipSunk: string;
        move: {
          x: number;
          y: number;
          isHit: boolean;
        };
      }>(`${environment.apiUrl}/battleship-game/${this.battleshipGameId}/make-move`, {
        playerId: this.playerId,
        playerPassword: this.playerPassword,
        move: { x: row, y: col },
      })
      .subscribe({
        next: (response) => {
          const moveType = response.move.isHit ? 4 : 5;
          this.opponentGrid[response.move.x][response.move.y] = moveType;
          this.getBattleshipInfo();
          if (response.shipSunk) {
            this.notificationService.showNotification(`You sank the ${response.shipSunk}`, 'center', 'top');
          }
        },
        error: (error) => {
          console.error('Error making move:', error);
          this.loaderService.hide();
        },
        complete: () => {
          this.loaderService.hide();
        },
      });
  }

  private getBattleshipInfo() {
    this.httpClient
      .post<IBattleshipGameInfo>(`${environment.apiUrl}/battleship-game/${this.battleshipGameId}/get-game-info`, {
        playerId: this.playerId,
        playerPassword: this.playerPassword,
      })
      .subscribe((response) => {
        this.battleshipGameInfo = response;
        this.gameIsReady = this.battleshipGameInfo.positionsAreSet && this.battleshipGameInfo.opponentPositionsAreSet;
        this.playerIdTurn = this.battleshipGameInfo.playerIdTurn;

        if (this.battleshipGameInfo.playerIdWinner && this.battleshipGameInfo.winnerMessage) {
          // Do not send any more intervals.
          if (this.interval) {
            clearInterval(this.interval);
          }
        }

        // Initialize or reset myGrid
        this.myGrid = Array(10)
          .fill(0)
          .map(() => Array(10).fill(0));
        this.opponentGrid = Array(10)
          .fill(0)
          .map(() => Array(10).fill(0));

        // Populate myGrid based on received positions if they exist
        if (this.battleshipGameInfo?.positions) {
          for (const shipType in this.battleshipGameInfo.positions) {
            if (this.battleshipGameInfo.positions.hasOwnProperty(shipType as ShipType)) {
              const shipPositions = this.battleshipGameInfo.positions[shipType as ShipType];
              shipPositions.forEach((pos) => {
                if (pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10) {
                  this.myGrid[pos.x][pos.y] = 2; // Mark as ship part
                }
              });
            }
          }
        }
        this.battleshipGameInfo.moves.forEach((move) => {
          this.opponentGrid[move.x][move.y] = move.hit ? 4 : 5;
        });

        this.battleshipGameInfo.opponentMoves.forEach((move) => {
          this.myGrid[move.x][move.y] = move.hit ? 4 : 5;
        });
      });
  }

  sendWinnerMessage() {
    this.httpClient
      .post<any>(`${environment.apiUrl}/battleship-game/${this.battleshipGameId}/post-winner-message`, {
        playerId: this.playerId,
        playerPassword: this.playerPassword,
        message: this.winnerMessage,
      })
      .subscribe({
        next: (response) => {
          this.battleshipGameInfo!.winnerMessage = this.winnerMessage;
        },
      });
  }
  // --- http methods ---
}
