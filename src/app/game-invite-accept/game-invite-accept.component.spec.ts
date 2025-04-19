import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameInviteAcceptComponent } from './game-invite-accept.component';

describe('GameInviteAcceptComponent', () => {
  let component: GameInviteAcceptComponent;
  let fixture: ComponentFixture<GameInviteAcceptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameInviteAcceptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameInviteAcceptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
