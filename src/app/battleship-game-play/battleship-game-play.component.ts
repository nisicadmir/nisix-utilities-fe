import { Component } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-battleship-game-play',
  imports: [MenuComponent],
  templateUrl: './battleship-game-play.component.html',
  styleUrl: './battleship-game-play.component.scss',
})
export class BattleshipGamePlayComponent {
  battleshipGameId = '';
  playerName = '';
  playerPassword = '';

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe((params) => {
      this.battleshipGameId = params['battleshipGameId'];
      this.playerName = params['playerName'];
      this.playerPassword = params['playerPassword'];
    });
  }

  ngOnInit() {}
}
