import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Fingers } from '../shared/fingers';

@Component({
  selector: 'app-finger-sliders',
  templateUrl: './finger-sliders.component.html',
  styleUrls: ['./finger-sliders.component.css']
})
export class FingerSlidersComponent implements OnInit {
  readonly MAX_RANGE = 1000;
  readonly MIN_RANGE = -1000;
  readonly INIT_VALUE = 0;

  sliders = this.fb.group({
    little: [0],
    ring: [0],
    middle: [0],
    index: [0],
    thumbGroup: this.fb.group({
      thumb: [0],
      thenar: [0]
    })
  })

  initialValues = this.sliders.value;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.get();
  }

  get() {
    this.http.get<Fingers>(
      'https://476bc48d-1c5e-4896-973a-2c70adaeab95.mock.pstmn.io/fingers',
      {responseType: 'json'}
    ).subscribe(json => this.sliders.setValue(json));
  }

  update() {

    this.http.put(
      'https://476bc48d-1c5e-4896-973a-2c70adaeab95.mock.pstmn.io/fingers',
      {value: this.sliders.value},
      {responseType: 'json'}
      ).subscribe(res => console.warn(res));
  }

  reset() {
    this.sliders.reset(this.initialValues);
    this.update();
  }

}
