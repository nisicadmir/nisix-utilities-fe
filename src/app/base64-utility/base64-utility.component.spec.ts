import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Base64UtilityComponent } from './base64-utility.component';

describe('Base64UtilityComponent', () => {
  let component: Base64UtilityComponent;
  let fixture: ComponentFixture<Base64UtilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Base64UtilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Base64UtilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
