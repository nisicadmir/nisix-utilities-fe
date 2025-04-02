import { ComponentFixture, TestBed } from '@angular/core/testing';

import { circuitGameComponent } from './circuit-game.component';

describe('circuitGameComponent', () => {
  let component: circuitGameComponent;
  let fixture: ComponentFixture<circuitGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [circuitGameComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(circuitGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
