import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-right-arm',
  templateUrl: './right-arm.component.html',
  styleUrls: ['./right-arm.component.css']
})
export class RightArmComponent {
  constructor(){}

  sliders: FormGroup = new FormGroup({
    SidePosition: new FormControl(0),
    LiftedPosition: new FormControl(0),
    UpperArmRotation: new FormControl(0),
    EllbowPosition: new FormControl(0),
    LowerArmRotation: new FormControl(0),
    WristPosition: new FormControl(0)
  });
  MIN_RANGE = -9000;
  MAX_RANGE = 9000;
  sliderTrigger$ = new Subject<string>;
  side!: string;

  ngOnInit(): void {
    console.log('Component initialized');
    this.sliderTrigger$.pipe(debounceTime(1000)).subscribe(value => {
      console.log(value);
    });
  }

  reset(){
    this.sliders.reset();
  }
}
