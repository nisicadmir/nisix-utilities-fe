import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretMessageReadComponent } from './secret-message-read.component';

describe('SecretMessageReadComponent', () => {
  let component: SecretMessageReadComponent;
  let fixture: ComponentFixture<SecretMessageReadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretMessageReadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecretMessageReadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
