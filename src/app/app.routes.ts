import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TimeConverterComponent } from './time-converter/time-converter.component';
import { PasswordGeneratorComponent } from './password-generator/password-generator.component';
import { UuidGeneratorComponent } from './uuid-generator/uuid-generator.component';
import { circuitGameComponent } from './circuit-game/circuit-game.component';
import { SnakeGameComponent } from './snake-game/snake-game.component';
import { BattleshipGameComponent } from './battleship-game/battleship-game.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'time-converter', component: TimeConverterComponent },
  { path: 'password-generator', component: PasswordGeneratorComponent },
  { path: 'uuid-generator', component: UuidGeneratorComponent },
  { path: 'circuit-game', component: circuitGameComponent },
  { path: 'snake-game', component: SnakeGameComponent },
  { path: 'battleship-game', component: BattleshipGameComponent },
  { path: '**', redirectTo: '' },
];
