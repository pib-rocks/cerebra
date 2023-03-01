import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { FingerService } from '../shared/finger.service';
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
  @Input() groupSide = 'left';
  @Input() isGroup = false;
  @Input() sliderTrigger$ = new Subject<string>();

  isCombinedSlider = false;
  messageReceiver$ = new Subject<number>();

  formControl: FormControl = new FormControl(this.currentValue);

  constructor(private rosService: RosService, private fingerService: FingerService) {}

  ngOnInit(): void {
    this.isCombinedSlider = this.isGroup && this.labelName === "Open/Close all fingers";

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
    if (this.isCombinedSlider) {
      const fingerTopics = this.fingerService.getFingerTopics(this.groupSide);
      fingerTopics.forEach(t => this.rosService.sendMessage(t, this.formControl.value));
    } else {
      this.rosService.sendMessage(this.topicName, this.formControl.value);
    }
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
