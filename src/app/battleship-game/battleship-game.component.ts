import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { LoaderService } from '../_modules/loader/loader.service';
import { FirestoreService } from '../_firestore/firestore.service';
import { UtilService } from '../util.service';

interface GameInvite {
  id: string;
}

@Component({
  selector: 'app-battleship-game',
  imports: [MatButtonModule, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, RouterModule],
  templateUrl: './battleship-game.component.html',
  styleUrl: './battleship-game.component.scss',
})
export class BattleshipGameComponent {
  public isGameCreated = false;
  public playerId = '';
  public playerName = '';
  public playerPassword = '';
  public gameInviteId = '';
  public battleshipGameId = '';

  public formGroup = this.formBuilder.group({
    name1: ['', [Validators.required]],
    name2: ['', [Validators.required]],
  });
  constructor(
    private firestoreService: FirestoreService,
    private formBuilder: FormBuilder,
    private utilService: UtilService,
    private loaderService: LoaderService,
  ) {}

  public async createGame(): Promise<void> {
    const name1 = this.formGroup.value.name1;
    const name2 = this.formGroup.value.name2;
    if (name1 === name2) {
      alert('Names cannot be the same');
      return;
    }
    this.loaderService.show();
    try {
      const response = await this.firestoreService.createBattleshipGame(name1!, name2!);
      const player1 = response.player1;
      const gameInvite = response.gameInvite;

      this.playerId = player1.id;
      this.playerName = player1.name;
      this.playerPassword = player1.password;

      this.battleshipGameId = response.battleshipGameId;
      this.gameInviteId = gameInvite.id;

      this.isGameCreated = true;
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error creating game');
    } finally {
      this.loaderService.hide();
    }
  }

  public copyInvite(): void {
    const url = `${environment.url}/game-invite-accept?id=${this.gameInviteId}`;
    this.utilService.copyToClipboard(url);
  }
}
