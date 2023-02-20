import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { Fingers } from '../shared/fingers';

@Component({
  selector: 'app-finger-sliders',
  templateUrl: './finger-sliders.component.html',
  styleUrls: ['./finger-sliders.component.css']
})
export class FingerSlidersComponent {
  readonly MAX_RANGE = 1000;
  readonly MIN_RANGE = -1000;
  readonly INIT_VALUE = 0;
  private readonly URL = '/api/pib/finger/';

  @Input() componentName: string = 'Left' || 'Right';
  @Input() sliderTrigger$ = new Subject<string>();
  message!: string;


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
}
