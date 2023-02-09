import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
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
  private readonly URL = 'http://localhost:8080/api/pib/init';

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

  ngOnInit(): void {
    this.get();
    /** 
    this.sliderTrigger$.pipe(
      debounceTime(100)
    ).subscribe(f => this.updateFinger(f));
    */
   this.sliderTrigger$.pipe(debounceTime(100)).subscribe(value => {
    this.sendRequestToServer(value);
   });
  }

  get() {
    this.http.get<Fingers>(
      `${this.URL}/${this.componentName}`,
      {responseType: 'json'}
    ).subscribe(json => this.sliders.setValue(json));
  }

  /** 
  updateFinger(fingerName: string) {
    let finger =
    {
      [fingerName]: this.sliders.get(fingerName)
        ? this.sliders.get(fingerName)?.value
        : this.sliders.get('thumbGroup')?.get(fingerName)?.value
    }

    this.http.patch(
      `${this.URL}/${this.componentName}-hand`,
      finger,
      {responseType: 'json'}
      ).subscribe(res => console.warn(res));
  }

  updateAll() {
    this.http.put(
      `${this.URL}/${this.componentName}-hand`,
      this.sliders.value,
      {responseType: 'json'}
      ).subscribe(res => console.warn(res));
  }
*/
  sendRequestToServer(fingerName: string){
    let finger =
    {
      [fingerName]: this.sliders.get(fingerName)
        ? this.sliders.get(fingerName)?.value
        : this.sliders.get('thumbGroup')?.get(fingerName)?.value
    }
    console.log(finger[fingerName]);
    this.http.get(`http://localhost:8080/api/pib/${fingerName}/${finger[fingerName]}` ,{responseType: 'text'}).subscribe(data => {
      
      this.message = data;
      
  });

  }

  reset() {
    this.sliders.reset(this.initialValues);
    //this.updateAll();
  }
}
