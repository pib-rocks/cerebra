import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import * as ROSLIB from "roslib";
import { RosService } from "../shared/ros.service";
import { SliderComponent } from "../slider/slider.component";


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


  thumbOppositionLeft = { motor: "thumb_left_opposition", label: "Thumb opposition" };
  constructor(private rosService: RosService){  }
  ngOnInit(): void {
    this.setRefreshRate(0.5);
    this.rosService.setPreviewSize(640, 480);
    this.rosService.setQualityFactor(80);
    this.imageSrc = '../../assets/pib-Logo.png'
    this.rosService.cameraReceiver$.subscribe(message => {
      this.imageSrc = 'data:image/jpeg;base64,' + message;
      console.log('-------------------------');
      console.log(message);
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  imageSrc!: string;  
  componentName = "Live view";
  refreshRateControl = new FormControl(0.5);
  qualityFactorControl = new FormControl(80);
  selectedSize = "480p (SD)";
  cameraActiveIcon = "M880-275 720-435v111L244-800h416q24 0 42 18t18 42v215l160-160v410ZM848-27 39-836l42-42L890-69l-42 42ZM159-800l561 561v19q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h19Z";


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
    this.selectedSize = height + 'p' + ' ' + '(' + this.resolution + ')';
    this.isLoading = true; 
    this.rosService.setPreviewSize(width, height);
    setTimeout(() => {
      this.isLoading = false;  // Stop the spinner
    }, 1500);
  }

  setRefreshRate(refreshRate : number){
    console.log("test");
    this.rosService.setTimerPeriod(refreshRate);
    this.refreshRateControl.setValue(refreshRate);
  }
  inputRefreshRate(refreshRate : number) {
    console.log("refreshRate:" + refreshRate);
    clearTimeout(this.timer);
    this.setRefreshRate(refreshRate);
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
    this.changeCameraIcon();
  }

  changeCameraIcon(){
    if(this.isCameraActive){
      this.cameraActiveIcon = "M140-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h520q24 0 42 18t18 42v215l160-160v410L720-435v215q0 24-18 42t-42 18H140Z";
    }else{
      this.cameraActiveIcon = "M880-275 720-435v111L244-800h416q24 0 42 18t18 42v215l160-160v410ZM848-27 39-836l42-42L890-69l-42 42ZM159-800l561 561v19q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h19Z";
    }
  }

  inputQualityFactor(value : number){
    clearTimeout(this.timer);
    this.setQualityFactor(value)
}
  setQualityFactor(qualityFactor : number){
  this.rosService.setQualityFactor(qualityFactor);
  this.qualityFactorControl.setValue(qualityFactor);
  }
}