import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeConverterSeoComponent } from './time-converter-seo.component';

describe('TimeConverterSeoComponent', () => {
  let component: TimeConverterSeoComponent;
  let fixture: ComponentFixture<TimeConverterSeoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeConverterSeoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeConverterSeoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
