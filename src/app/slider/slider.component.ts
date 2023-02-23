import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { RosService } from '../ros.service';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {
  @Input() maxRange = 1000;
  @Input() minRange = -1000;
  @Input() value = 0;
  @Input() rosTopic = '';
  @Input() labelName = '';

  @Input() sliderTrigger$ = new Subject<string>();

  ros = RosService.Instance;
  formControl: FormControl = new FormControl();

  ngOnInit(): void {
    this.ros.isInitialized$.subscribe((isInitialized: any) => {
      if (isInitialized) {
        this.formControl.setValue(this.ros.retrieveLastValue(this.rosTopic));
        this.ros.subscribe(this.rosTopic, this.formControl);
      }
    })
  }

  sendMessage() {
    this.ros.sendMessage(this.rosTopic, this.formControl.value);
  }
}
