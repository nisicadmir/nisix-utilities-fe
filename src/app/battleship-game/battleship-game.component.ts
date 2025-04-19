import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { UtilService } from '../util.service';
import { Player } from '../models/player.model';
import { MenuComponent } from '../menu/menu.component';

interface GameInvite {
  id: string;
}

@Component({
  selector: 'app-battleship-game',
  imports: [MatButtonModule, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, RouterModule, MenuComponent],
  templateUrl: './battleship-game.component.html',
  styleUrl: './battleship-game.component.scss',
})
export class BattleshipGameComponent {
  public isGameCreated = false;
  public playerName = '';
  public playerPassword = '';
  public gameInviteId = '';
  public battleshipGameId = '';

  public formGroup = this.formBuilder.group({
    name1: ['', [Validators.required]],
    name2: ['', [Validators.required]],
  });
  constructor(private httpClient: HttpClient, private formBuilder: FormBuilder, private utilService: UtilService) {}

  public onCellClick(row: number, col: number): void {
    console.log('onCellClick', row, col);
  }

  public createGame(): void {
    const name1 = this.formGroup.value.name1;
    const name2 = this.formGroup.value.name2;
    if (name1 === name2) {
      alert('Names cannot be the same');
      return;
    }
    this.httpClient
      .post<{ player1: Player; battleshipGameId: string; gameInvite: GameInvite }>(
        `${environment.apiUrl}/battleship-game/create`,
        {
          name1: this.formGroup.value.name1,
          name2: this.formGroup.value.name2,
        },
      )
      .subscribe((response) => {
        const player1 = response.player1;
        const gameInvite = response.gameInvite;

        this.playerPassword = player1.password;
        this.playerName = player1.name;

        this.battleshipGameId = response.battleshipGameId;
        this.gameInviteId = gameInvite.id;

        this.isGameCreated = true;
      });
  }

  public copyInvite(): void {
    const url = `${environment.url}/game-invite-accept/${this.gameInviteId}`;
    this.utilService.copyToClipboard(url);
  }
}
