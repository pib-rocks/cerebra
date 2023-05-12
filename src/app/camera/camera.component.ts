import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Subject } from "rxjs";
import * as ROSLIB from "roslib";
import { RosService } from "../shared/ros.service";

@Component({
  selector: "app-camera",
  templateUrl: "./camera.component.html",
  styleUrls: ["./camera.component.css"],
})
export class CameraComponent implements OnInit {
  timer:any = null;
  constructor(private rosService: RosService){}
  ngOnInit(): void {
    this.imageSrc = '../../assets/pib-Logo.png'
    this.rosService.cameraReceiver$.subscribe(message => {
      this.imageSrc = 'data:image/jpeg;base64,' + message;
      console.log('-------------------------');
      console.log(this.imageSrc);
    })
    this.refrechRate();
  }

  imageSrc!: string;  
  componentName = "Live view";
  refreshRateControl = new FormControl(0.1);
  selectedSize = "480p";

  private imageTopic!: ROSLIB.Topic;
  
  setActive(resolutionsize: string) {
    this.selectedSize = resolutionsize;
  }

  refrechRate(){
    this.rosService.setTimerPeriod(this.refreshRateControl.value);
  }
  inputRefrechRate() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.refrechRate();
    }, 500);
  }

}
