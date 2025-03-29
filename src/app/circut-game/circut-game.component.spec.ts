import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircutGameComponent } from './circut-game.component';

describe('CircutGameComponent', () => {
  let component: CircutGameComponent;
  let fixture: ComponentFixture<CircutGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircutGameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircutGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
