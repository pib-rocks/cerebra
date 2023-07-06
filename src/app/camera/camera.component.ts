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
  isCameraActive = false;
  toggleCamera = new FormControl(false);
  resolution = 'SD';
  constructor(private rosService: RosService){  }
  ngOnInit(): void {
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

  imageSrc!: string;  
  componentName = "Live view";
  refreshRateControl = new FormControl(0.1);
  qualityFactorControl = new FormControl(80);
  selectedSize = "480p (SD)";

  private imageTopic!: ROSLIB.Topic;
  
  setSize(width: number, height: number) {
    this.resolution = 'SD'
    if(height != null){
      if(height >= 1080){
        this.resolution = 'FHD';
      }else if(height >= 720){
        this.resolution = 'HD';
      }else{
        this.resolution = 'SD';
      }
    }
    this.selectedSize = height+ 'p' + ' ' + '(' + this.resolution + ')';
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

  toggleCameraState(){
    if(!this.isCameraActive){
      this.startCamera();
    }else{
      this.stopCamera();
    }
    this.isCameraActive = !this.isCameraActive;
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