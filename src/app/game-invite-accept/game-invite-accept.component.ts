import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Player } from '../models/player.model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-game-invite-accept',
  imports: [RouterModule, MatButtonModule],
  templateUrl: './game-invite-accept.component.html',
  styleUrl: './game-invite-accept.component.scss',
})
export class GameInviteAcceptComponent {
  public gameInviteId = '';
  public battleshipGameId = '';
  public playerName = '';
  public playerId = '';
  public playerPassword = '';

  constructor(private route: ActivatedRoute, private httpClient: HttpClient, private router: Router) {
    this.gameInviteId = this.route.snapshot.queryParams['id'];
  }

  public acceptGameInvite(): void {
    this.httpClient
      .post<{ battleshipGameId: string; player: Player }>(`${environment.apiUrl}/game-invite/accept/${this.gameInviteId}`, {})
      .subscribe({
        next: (response) => {
          this.battleshipGameId = response.battleshipGameId;
          this.playerId = response.player.id;
          this.playerName = response.player.name;
          this.playerPassword = response.player.password;
        },
        error: (error) => {
          // this.router.navigate(['/battleship-game']);
        },
        complete: () => {
          // this.router.navigate(['/battleship-game']);
        },
      });
  }
}
