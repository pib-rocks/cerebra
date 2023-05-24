import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import * as ROSLIB from "roslib";
import { RosService } from "../shared/ros.service";

@Component({
  selector: "app-camera",
  templateUrl: "./camera.component.html",
  styleUrls: ["./camera.component.css"],
})
export class CameraComponent implements OnInit, OnDestroy {
  timer:any = null;
  isLoading = false;
  constructor(private rosService: RosService){  }
  ngOnInit(): void {
    this.refrechRate();
    this.rosService.setPreviewSize(640, 480);
    this.rosService.setQualityFactor(80);
    this.imageSrc = '../../assets/pib-Logo.png'
    this.rosService.cameraReceiver$.subscribe(message => {
      this.imageSrc = 'data:image/jpeg;base64,' + message;
      console.log('-------------------------');
      console.log(message);
    })
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  imageSrc!: string;  
  componentName = "Live view";
  refreshRateControl = new FormControl(0.1);
  qualityFactorControl = new FormControl(80);
  selectedSize = "480p";

  private imageTopic!: ROSLIB.Topic;
  
  setSize(width: number, height: number) {
    this.selectedSize = height+ 'p';
    this.isLoading = true; 
    this.rosService.setPreviewSize(width, height);
    setTimeout(() => {
      this.isLoading = false;  // Stop the spinner
    }, 1500);
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

  startCamera(){
    this.rosService.subscribeCameraTopic();
  }

  stopCamera(){
    this.rosService.unsubscribeCameraTopic();
    //this.imageSrc = '../../assets/pib-Logo.png'
  }
  inputQualityFactor(){
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.setQualityFactor();
    }, 500);
}
  setQualityFactor(){
  this.rosService.setQualityFactor(this.qualityFactorControl.value);
  }
}