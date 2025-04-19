import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattleshipGamePlayComponent } from './battleship-game-play.component';

describe('BattleshipGamePlayComponent', () => {
  let component: BattleshipGamePlayComponent;
  let fixture: ComponentFixture<BattleshipGamePlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleshipGamePlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BattleshipGamePlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
