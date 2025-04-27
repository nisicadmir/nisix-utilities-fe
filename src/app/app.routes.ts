import { Routes } from '@angular/router';
import { BattleshipGamePlayComponent } from './battleship-game-play/battleship-game-play.component';
import { BattleshipGameComponent } from './battleship-game/battleship-game.component';
import { circuitGameComponent } from './circuit-game/circuit-game.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { GameInviteAcceptComponent } from './game-invite-accept/game-invite-accept.component';
import { PasswordGeneratorComponent } from './password-generator/password-generator.component';
import { SnakeGameComponent } from './snake-game/snake-game.component';
import { TimeConverterComponent } from './time-converter/time-converter.component';
import { UuidGeneratorComponent } from './uuid-generator/uuid-generator.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'time-converter', component: TimeConverterComponent },
  { path: 'password-generator', component: PasswordGeneratorComponent },
  { path: 'uuid-generator', component: UuidGeneratorComponent },
  { path: 'circuit-game', component: circuitGameComponent },
  { path: 'snake-game', component: SnakeGameComponent },
  { path: 'game-invite-accept', component: GameInviteAcceptComponent },
  { path: 'battleship-game', component: BattleshipGameComponent },
  { path: 'battleship-game-play', component: BattleshipGamePlayComponent },
  { path: '**', redirectTo: '' },
];
