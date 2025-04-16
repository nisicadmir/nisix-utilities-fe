import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattleshipGameComponent } from './battleship-game.component';

describe('BattleshipGameComponent', () => {
  let component: BattleshipGameComponent;
  let fixture: ComponentFixture<BattleshipGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleshipGameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BattleshipGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
