import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { RosService } from '../shared/ros.service';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {

  maxRange = 1000;
  minRange = -1000;
  currentValue = 0;
  @Input() topicName = '';
  @Input() labelName = '';

  @Input() sliderTrigger$ = new Subject<string>();
  messageReceiver$ = new Subject<number>();

  formControl: FormControl = new FormControl(this.currentValue);

  constructor( private rosService: RosService) {}

  ngOnInit(): void {
    this.messageReceiver$.subscribe(value => {
      this.formControl.setValue(this.getValueWithinRange(value));
    });

    this.rosService.isInitialized$.subscribe((isInitialized: boolean) => {
      if (isInitialized) {
        this.rosService.subscribeTopic(this.topicName, this.messageReceiver$);
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
