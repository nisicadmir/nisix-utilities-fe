import { Component } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

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

interface IBattleshipGameInfo {
  status: BattleshipGameStatus;
  positions: IBattleshipGamePositions;
  positionsAreSet: boolean;
  opponentPositionsAreSet: boolean;
  opponentName: string;
}

interface ShipInfo {
  name: keyof IBattleshipGamePositions;
  size: number;
}

type ShipType = keyof IBattleshipGamePositions;

@Component({
  selector: 'app-battleship-game-play',
  imports: [MenuComponent, MatButtonModule, CommonModule],
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
  grid: number[][] = Array(10)
    .fill(0)
    .map(() => Array(10).fill(0));

  constructor(private route: ActivatedRoute, private httpClient: HttpClient) {
    this.route.params.subscribe((params) => {
      this.battleshipGameId = params['id'];
    });
    this.route.queryParams.subscribe((params) => {
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

  private getBattleshipInfo() {
    this.httpClient
      .post<IBattleshipGameInfo>(`${environment.apiUrl}/battleship-game/${this.battleshipGameId}/get-game-info`, {
        playerId: this.playerId,
        playerPassword: this.playerPassword,
      })
      .subscribe((response) => {
        console.log(response);
        this.battleshipGameInfo = response;
        this.gameIsReady = this.battleshipGameInfo.positionsAreSet && this.battleshipGameInfo.opponentPositionsAreSet;
      });
  }

  startSettingPositions() {
    this.resetGrid();
    this.currentShipIndex = 0;
    this.setCurrentShip();
    this.isInSettingPositions = true;
  }

  resetGrid() {
    this.grid = Array(10)
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
    this.grid[row][col] = 1; // Mark as part of the current ship

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
    if (row < 0 || row >= 10 || col < 0 || col >= 10 || this.grid[row][col] !== 0) {
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
      this.grid[pos.x][pos.y] = 2;
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
          if (this.grid[r][c] === 0) {
            // Only mark empty cells
            this.grid[r][c] = 3; // Mark as adjacent
          }
        }
      }
    });
  }

  clearPositions() {
    this.resetGrid();
  }

  sendPositions() {
    // Prepare data for API: convert current positions object
    const finalPositions: Partial<IBattleshipGamePositions> = {};
    for (const shipName in this.battleshipPositions) {
      if (this.battleshipPositions.hasOwnProperty(shipName as ShipType)) {
        finalPositions[shipName as ShipType] = [...this.battleshipPositions[shipName as ShipType]];
      }
    }

    console.log('finalPositions', finalPositions);

    this.httpClient
      .post<any>(`${environment.apiUrl}/battleship-game/${this.battleshipGameId}/set-ship-positions`, {
        playerId: this.playerId,
        playerPassword: this.playerPassword,
        positions: finalPositions,
      })
      .subscribe({
        next: (response) => {
          console.log('Positions set response:', response);
          this.getBattleshipInfo(); // Refresh game info
          this.isInSettingPositions = false;
        },
        error: (error) => {
          console.error('Error setting positions:', error);
        },
        // complete: () => { console.log('Position setting complete'); } // Optional
      });
  }

  getCellClass(row: number, col: number): string {
    const cellState = this.grid[row][col];

    switch (cellState) {
      case 1:
        return 'ship-placing'; // Current ship being placed
      case 2:
        return 'ship-placed'; // Permanently placed ship
      case 3:
        return 'adjacent-to-ship'; // Adjacent/Blocked cell
      default: // Empty cell (0)
        if (this.isInSettingPositions && this.isValidClick(row, col)) {
          return 'valid-placement';
        }
        return ''; // Just an empty cell
    }
  }
}
