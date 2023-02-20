import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css']
})
export class CameraComponent {
  componentName = "Live view";

  sliderTrigger$ = new Subject<string>();
  refreshRateControl = new FormControl(0.5);


}
