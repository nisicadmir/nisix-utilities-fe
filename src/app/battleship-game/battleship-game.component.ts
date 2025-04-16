import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

/*
 * grid 10x10
 *
 * 1 Aircraft Carrier – 5 fields
 * 1 Battleship – 4 fields
 * 1 Submarine – 3 fields
 * 1 Cruiser – 3 fields
 * 1 Destroyer – 2 fields
 * ships cannot be added in diagonal
 * ships cannot touch eachother nor overlay
 *
 * start a game
 * get url and password for each player
 * everybody joins the game
 * adding battleships
 * start the game
 *
 * moves player 1
 * moves player 2
 *
 *
 */
@Component({
  selector: 'app-battleship-game',
  imports: [MatButtonModule, CommonModule],
  templateUrl: './battleship-game.component.html',
  styleUrl: './battleship-game.component.scss',
})
export class BattleshipGameComponent {
  constructor() {}

  public startGame(): void {
    console.log('startGame');
  }

  public onCellClick(row: number, col: number): void {
    console.log('onCellClick', row, col);
  }
}
