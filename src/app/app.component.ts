import { Component, ElementRef, ViewChild } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DateTime, Settings, Duration, DurationObjectUnits } from 'luxon';
import { TIMEZONES } from './timezones';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    JsonPipe,
  ],
})
export class AppComponent {
  @ViewChild('input')
  public input!: ElementRef<HTMLInputElement>;

  public formGroup: FormGroup;
  public formGroupFrmDateToMillis: FormGroup;
  public formGroupFromMillisToObject: FormGroup;
  public formGroupFromObjectToMillis: FormGroup;

  public currentTimeInGMT = '';
  public currentTimeInChosenTimezone = '';

  public dataGMT = '';
  public dataLocal = '';
  public offset: number = 0;
  public dataFromDateToMillis: number | null = null;
  public dataFromDateToMillisGMT: number | null = null;
  public dataFromMillisToObject: DurationObjectUnits | null = Duration.fromMillis(0)
    .shiftTo('days', 'hours', 'minutes', 'seconds')
    .toObject();
  public dataFromObjectToMillis: number | null = null;

  public timezones = TIMEZONES;
  public filteredOptions: string[] = TIMEZONES;
  public timezoneControl = new FormControl<string>(Settings.defaultZone.name);

  constructor(private formBuilder: FormBuilder) {
    this.formGroup = this.formBuilder.group({
      time: [Date.now(), Validators.required],
    });
    const date = DateTime.fromMillis(Date.now());

    this.formGroupFrmDateToMillis = this.formBuilder.group({
      year: [date.year, Validators.required],
      month: [date.month, Validators.required],
      day: [date.day, Validators.required],
      hour: [date.hour, Validators.required],
      minute: [date.minute, Validators.required],
      second: [date.second, Validators.required],
    });
    this.formGroupFromMillisToObject = this.formBuilder.group({
      time: [0, Validators.required],
    });
    this.formGroupFromObjectToMillis = this.formBuilder.group({
      seconds: [0, Validators.required],
      minutes: [0, Validators.required],
      hours: [0, Validators.required],
      days: [0, Validators.required],
    });
  }

  ngOnInit() {
    const zone = this.timezoneControl.value;
    if (zone) {
      this.offset = DateTime.fromMillis(Date.now(), { zone }).offset;
    }
    setInterval(() => {
      this.intervalMethod();
    }, 500);

    this.translateFromMillisToTime();
    this.translateFromDateToMillis();
  }

  private intervalMethod() {
    const zone = this.timezoneControl.value;
    if (zone) {
      this.offset = DateTime.fromMillis(Date.now(), { zone }).offset;
      this.currentTimeInGMT = DateTime.now().toUTC().toFormat('ccc, dd LLL yyyy HH:mm:ss');
      this.currentTimeInChosenTimezone = DateTime.now().setZone(zone).toFormat('ccc, dd LLL yyyy HH:mm:ss');
    }
  }

  public translateFromMillisToTime() {
    console.log('Your timezone is: ', this.timezoneControl.value);
    if (!this.timezoneControl.value) {
      alert('Timezone must be selected');
      return;
    }
    const date = DateTime.now();
    console.log('offset', date.offset);
    const value = this.formGroup.get('time')?.value;
    console.log('value', value);

    const dateGMT = DateTime.fromMillis(value).toUTC();
    this.dataGMT = dateGMT.toFormat('ccc, dd LLL yyyy HH:mm:ss.SSS');
    const dateLocal = DateTime.fromMillis(value, { zone: this.timezoneControl.value });
    this.dataLocal = dateLocal.toFormat('ccc, dd LLL yyyy HH:mm:ss.SSS');
  }

  public translateFromDateToMillis() {
    const year = this.formGroupFrmDateToMillis.get('year')?.value;
    const month = this.formGroupFrmDateToMillis.get('month')?.value;
    const day = this.formGroupFrmDateToMillis.get('day')?.value;
    const hour = this.formGroupFrmDateToMillis.get('hour')?.value;
    const minute = this.formGroupFrmDateToMillis.get('minute')?.value;
    const second = this.formGroupFrmDateToMillis.get('second')?.value;

    this.dataFromDateToMillis = DateTime.fromFormat(`${year}-${month}-${day} ${hour}:${minute}:${second}`, 'yyyy-L-d H:m:s', {
      zone: this.timezoneControl.value as string,
    }).toMillis();

    this.dataFromDateToMillisGMT = DateTime.fromFormat(`${year}-${month}-${day} ${hour}:${minute}:${second}`, 'yyyy-L-d H:m:s', {
      zone: 'UTC',
    }).toMillis();
  }

  public translateFromMillisToObject() {
    const value = this.formGroupFromMillisToObject.get('time')?.value;

    this.dataFromMillisToObject = Duration.fromMillis(value).shiftTo('days', 'hours', 'minutes', 'seconds').toObject();
  }

  public translateFromObjectToMillis() {
    const second = this.formGroupFromObjectToMillis.get('seconds')?.value || 0;
    const minute = this.formGroupFromObjectToMillis.get('minutes')?.value || 0;
    const hour = this.formGroupFromObjectToMillis.get('hours')?.value || 0;
    const day = this.formGroupFromObjectToMillis.get('days')?.value || 0;
    this.dataFromObjectToMillis = second * 1000 + minute * 60 * 1000 + hour * 60 * 60 * 1000 + day * 24 * 60 * 60 * 1000;
  }

  filter(): void {
    const filterValue = this.input.nativeElement.value.toLowerCase();
    this.filteredOptions = this.timezones.filter((one) => one.toLowerCase().includes(filterValue));
  }
  focus(): void {
    this.filteredOptions = this.timezones.slice();
  }
}
