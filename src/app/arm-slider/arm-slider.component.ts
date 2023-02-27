import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import {  Subject } from 'rxjs';
import { RosService } from '../shared/ros.service';

@Component({
  selector: 'app-arm-slider',
  templateUrl: './arm-slider.component.html',
  styleUrls: ['./arm-slider.component.css']
})
export class ArmSliderComponent {
  maxRange = 1000;
  minRange = -1000;
  currentValue = 0;
  @Input() topicName = '';
  @Input() labelName = '';

  @Input() sliderTrigger$ = new Subject<string>();
  messageReceiver = new Subject<number>();

  formControl: FormControl = new FormControl(this.currentValue);


  constructor(private rosService: RosService) {}

  ngOnInit(): void {
    this.rosService.isInitialized$.subscribe((isInitialized: any) => {
      if (isInitialized) {
        this.messageReceiver.subscribe(value => {
          this.formControl.setValue(this.getValueWithinRange(value));
        });
        this.rosService.subscribeTopic(this.topicName, this.messageReceiver);
      }
    })
  }

  sendMessage() {
    this.rosService.sendMessage(this.topicName, this.formControl.value);
  }

  getValueWithinRange(value: number) {
    let validVal;
    if (value > this.maxRange) {
      validVal = this.maxRange;
    } else if (value < this.minRange) {
      validVal = this.minRange;
    } else {
      validVal = value;
    }
    return validVal;
  }
}
