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

  // Track temporary positions during ship placement
  tempShipPositions: Array<{ x: number; y: number }> = [];

  battleshipPositions: IBattleshipGamePositions = {
    carrier: [],
    battleship: [],
    cruiser: [],
    submarine: [],
    destroyer: [],
  };

  // Grid representation for validation
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

        // Check if both players are ready
        if (this.battleshipGameInfo.positionsAreSet && this.battleshipGameInfo.opponentPositionsAreSet) {
          this.gameIsReady = true;
        }
      });
  }

  startGame() {}

  startSettingPositions() {
    this.resetGrid();
    this.currentShipIndex = 0;
    this.currentShip = this.ships[this.currentShipIndex].name;
    this.currentShipSize = this.ships[this.currentShipIndex].size;
    this.isInSettingPositions = true;
    this.tempShipPositions = [];
  }

  resetGrid() {
    // Reset grid to all zeros
    this.grid = Array(10)
      .fill(0)
      .map(() => Array(10).fill(0));

    // Reset positions
    this.battleshipPositions = {
      carrier: [],
      battleship: [],
      cruiser: [],
      submarine: [],
      destroyer: [],
    };
  }

  public onCellClick(row: number, col: number): void {
    if (!this.isInSettingPositions) return;

    if (this.canPlaceShip(row, col)) {
      this.placeShip(row, col);

      // Move to next ship after placing current one
      if (this.battleshipPositions[this.currentShip].length === this.currentShipSize) {
        this.moveToNextShip();
      }
    }
  }

  public canPlaceShip(row: number, col: number): boolean {
    const shipPositions = this.battleshipPositions[this.currentShip];

    // If this is the first cell of the ship
    if (shipPositions.length === 0) {
      return this.validateInitialPlacement(row, col);
    }

    // If this is the second cell, determine direction and validate
    if (shipPositions.length === 1) {
      const firstCell = shipPositions[0];

      // Check if trying to place horizontally
      if (row === firstCell.x && col === firstCell.y + 1) {
        return this.validateInitialPlacement(row, col);
      }

      // Check if trying to place vertically
      if (col === firstCell.y && row === firstCell.x + 1) {
        return this.validateInitialPlacement(row, col);
      }

      return false; // Not adjacent in either direction
    }

    // For subsequent cells, follow the established direction
    const lastCell = shipPositions[shipPositions.length - 1];
    const secondLastCell = shipPositions[shipPositions.length - 2];

    // Determine if placement is horizontal or vertical based on previous cells
    const isHorizontal = lastCell.x === secondLastCell.x;

    if (isHorizontal) {
      // Must be in the same row and one column to the right
      return row === lastCell.x && col === lastCell.y + 1 && this.validateInitialPlacement(row, col);
    } else {
      // Must be in the same column and one row down
      return col === lastCell.y && row === lastCell.x + 1 && this.validateInitialPlacement(row, col);
    }
  }

  private validateInitialPlacement(row: number, col: number): boolean {
    // Check if coordinates are within grid
    if (row < 0 || row >= 10 || col < 0 || col >= 10) {
      return false;
    }

    // Check if cell is already occupied
    if (this.grid[row][col] !== 0) {
      return false;
    }

    // Check if ship would fit on the grid
    const shipPositions = this.battleshipPositions[this.currentShip];

    if (shipPositions.length >= 1) {
      const firstCell = shipPositions[0];

      // If we have at least two cells, determine direction
      if (shipPositions.length >= 2) {
        const secondCell = shipPositions[1];
        const isHorizontal = firstCell.x === secondCell.x;

        if (isHorizontal) {
          // Check if the ship would extend beyond the grid horizontally
          if (col >= 10 || col < 0) {
            return false;
          }

          // Check that we don't exceed ship size horizontally
          const minCol = Math.min(...shipPositions.map((p) => p.y), col);
          const maxCol = Math.max(...shipPositions.map((p) => p.y), col);
          if (maxCol - minCol + 1 > this.currentShipSize) {
            return false;
          }
        } else {
          // Check if the ship would extend beyond the grid vertically
          if (row >= 10 || row < 0) {
            return false;
          }

          // Check that we don't exceed ship size vertically
          const minRow = Math.min(...shipPositions.map((p) => p.x), row);
          const maxRow = Math.max(...shipPositions.map((p) => p.x), row);
          if (maxRow - minRow + 1 > this.currentShipSize) {
            return false;
          }
        }
      } else {
        // For the second cell, ensure ship would fit in both directions
        // This is less restrictive because direction is not yet determined
        const horizontalEnd = firstCell.y + this.currentShipSize - 1;
        const verticalEnd = firstCell.x + this.currentShipSize - 1;

        if (horizontalEnd >= 10 && verticalEnd >= 10) {
          return false; // Ship won't fit in either direction
        }
      }
    }

    // Check if ship would touch any other ship (including diagonally)
    return !this.wouldTouchAnotherShip(row, col);
  }

  private wouldTouchAnotherShip(row: number, col: number): boolean {
    // Check surrounding cells (including diagonals)
    for (let r = Math.max(0, row - 1); r <= Math.min(9, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(9, col + 1); c++) {
        if (this.grid[r][c] !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  private placeShip(row: number, col: number): void {
    // Add position to ship
    this.battleshipPositions[this.currentShip].push({ x: row, y: col });

    // Mark as occupied in the grid (1 = occupied by ship)
    this.grid[row][col] = 1;
  }

  private moveToNextShip(): void {
    // Mark adjacent cells as unavailable (2 = adjacent to ship)
    this.markAdjacentCells();

    this.currentShipIndex++;
    if (this.currentShipIndex < this.ships.length) {
      this.currentShip = this.ships[this.currentShipIndex].name;
      this.currentShipSize = this.ships[this.currentShipIndex].size;
    } else {
      // All ships have been placed
      this.finishShipPlacement();
    }
  }

  private markAdjacentCells(): void {
    // Mark cells adjacent to the recently placed ship as unavailable
    this.battleshipPositions[this.currentShip].forEach((pos) => {
      for (let r = Math.max(0, pos.x - 1); r <= Math.min(9, pos.x + 1); r++) {
        for (let c = Math.max(0, pos.y - 1); c <= Math.min(9, pos.y + 1); c++) {
          // Only mark if it's not already a ship
          if (this.grid[r][c] === 0) {
            this.grid[r][c] = 2;
          }
        }
      }
    });
  }

  private finishShipPlacement(): void {
    this.isInSettingPositions = false;
    this.setPositions();
  }

  setPositions() {
    this.httpClient
      .post<any>(`${environment.apiUrl}/battleship-game/${this.battleshipGameId}/set-positions`, {
        playerId: this.playerId,
        playerPassword: this.playerPassword,
        positions: this.battleshipPositions,
      })
      .subscribe((response) => {
        this.getBattleshipInfo();
      });
  }

  // Get cell class based on its status
  getCellClass(row: number, col: number): string {
    if (this.isInSettingPositions) {
      // If a ship is placed here
      if (this.isShipPlaced(row, col)) {
        return 'ship-placed';
      }

      // If this is adjacent to a ship
      if (this.grid[row][col] === 2) {
        return 'adjacent-to-ship';
      }

      // If user is in the process of placing and hovering
      if (this.battleshipPositions[this.currentShip].length > 0 && this.canPlaceShip(row, col)) {
        return 'valid-placement';
      }
    }

    return '';
  }

  private isShipPlaced(row: number, col: number): boolean {
    return this.grid[row][col] === 1;
  }
}
