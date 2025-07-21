import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretMessageGenerateComponent } from './secret-message-generate.component';

describe('SecretMessageGenerateComponent', () => {
  let component: SecretMessageGenerateComponent;
  let fixture: ComponentFixture<SecretMessageGenerateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretMessageGenerateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecretMessageGenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
