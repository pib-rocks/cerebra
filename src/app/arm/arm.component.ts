import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-arm',
  templateUrl: './arm.component.html',
  styleUrls: ['./arm.component.css']
})
export class ArmComponent implements OnInit{

  constructor(private route: ActivatedRoute){}

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
    this.route.params.subscribe((params: Params) => {
      this.side = params['side'];
      console.log(this.side);
    });
    this.sliderTrigger$.pipe(debounceTime(1000)).subscribe(value => {
      console.log(value);
    });
  }

  reset(){
    this.sliders.reset();
  }
}
