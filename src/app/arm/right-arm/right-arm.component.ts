import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-right-arm',
  templateUrl: './right-arm.component.html',
  styleUrls: ['./right-arm.component.css']
})
export class RightArmComponent implements OnInit{

  @Input() componentName: string = 'Left' || 'Right';
  sliders: FormGroup = new FormGroup({
    wirst: new FormControl(0),
    elbow: new FormControl(0),
    shoulder: new FormControl(0),
  });
  MIN_RANGE = -9000;
  MAX_RANGE = 9000;
  sliderTrigger$ = new Subject<string>;
  URL = "http://localhost:8080/api/pib/arm";
  message!: string;
  constructor(private http: HttpClient){}

  ngOnInit(): void {
    
    this.sliderTrigger$.pipe(debounceTime(1000)).subscribe(value => {
      console.log(value);
      this.sendRequestToServer(value);
    });
  }

  sendRequestToServer(value : string){
    
      const sliderValue = this.sliders.get(value)?.value;
      console.log(sliderValue);
      this.http.get(`${this.URL}/${value}/${sliderValue}`, {responseType: 'text'} ).subscribe(armMassege => this.message = armMassege);
    };

}
