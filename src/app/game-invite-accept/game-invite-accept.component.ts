import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { Player } from '../models/player.model';
import { MatButtonModule } from '@angular/material/button';
import { FirestoreService } from '../firestore.service';

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

  constructor(private route: ActivatedRoute, private firestoreService: FirestoreService, private router: Router) {
    this.gameInviteId = this.route.snapshot.queryParams['id'];
  }

  public async acceptGameInvite(): Promise<void> {
    try {
      const response = await this.firestoreService.acceptBattleshipGameInvite(this.gameInviteId);
      this.battleshipGameId = response.battleshipGameId;
      this.playerId = response.player.id;
      this.playerName = response.player.name;
      this.playerPassword = response.player.password;
    } catch (error: any) {
      console.error('Error accepting game invite:', error);
      alert(error.message || 'Error accepting game invite');
      // this.router.navigate(['/battleship-game']);
    }
  }
}
