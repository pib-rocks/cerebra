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
  imageSrc!: string;  
  componentName = "Live view";
  refreshRateControl = new FormControl(0.1);
  qualityFactorControl = new FormControl(80);
  selectedSize = "480p";
  constructor(private rosService: RosService){  }
  ngOnInit(): void {
    this.rosService.timerPeriodReceiver$.subscribe(value => {
        this.refreshRateControl.setValue(value);
    })
    this.rosService.qualityFactorReceiver$.subscribe(value => {
      this.qualityFactorControl.setValue(value);
  })
  this.rosService.previewSizeReceiver$.subscribe(value => {
    if (this.arraysEqual(value,[640, 480])){
      this.selectedSize = "480p";
    }
    if (this.arraysEqual(value,[1280, 720])){
      this.selectedSize = "720p";
    }
    if (this.arraysEqual(value,[1920, 1080])){
      this.selectedSize = "1080p";
    }
})
    this.setRefreshRate();
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

  arraysEqual(a: number[], b: number[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}


  private imageTopic!: ROSLIB.Topic;
  
  setSize(width: number, height: number) {
    this.selectedSize = height+ 'p';
    this.isLoading = true; 
    this.rosService.setPreviewSize(width, height);
    setTimeout(() => {
      this.isLoading = false;  // Stop the spinner
    }, 1500);
  }

  setRefreshRate(){
    this.rosService.setTimerPeriod(this.refreshRateControl.value);
  }
  inputRefreshRate() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.setRefreshRate();
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