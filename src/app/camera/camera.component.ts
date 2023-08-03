import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { RosService } from "../shared/ros.service";
import { Subject } from "rxjs";

@Component({
  selector: "app-camera",
  templateUrl: "./camera.component.html",
  styleUrls: ["./camera.component.css"],

  
})
export class CameraComponent implements OnInit, OnDestroy {

  qualityReceiver$! : Subject<number>;
  refreshRateReceiver$!: Subject<number>;
  
  timer:any = null;
  isLoading = false;
  isCameraActive = false;
  toggleCamera = new FormControl(false);
  resolution = 'SD';
  imageSrc!: string;  
  refreshRateControl: number = 0.1;
  qualityFactorControl : number = 80;
  selectedSize = "480p (SD)";
  cameraActiveIcon = "M880-275 720-435v111L244-800h416q24 0 42 18t18 42v215l160-160v410ZM848-27 39-836l42-42L890-69l-42 42ZM159-800l561 561v19q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h19Z";
  private imageTopic!: ROSLIB.Topic;
  constructor(
    private rosService: RosService,
    ){}

  ngOnInit(): void {
    this.rosService.previewSizeReceiver$.subscribe(value => {
      this.setSize(value[0], value[1], false);
  });
    this.rosService.setPreviewSize(640,480);
    this.imageSrc = '../../assets/camera-placeholder.jpg'
    this.rosService.cameraReceiver$.subscribe(message => {
      this.imageSrc = 'data:image/jpeg;base64,' + message;
      console.log('-------------------------');
    });
    this.qualityReceiver$ = this.rosService.qualityFactorReceiver$;
    this.refreshRateReceiver$ = this.rosService.timerPeriodReceiver$;
  }
  ngOnDestroy(): void {
    this.stopCamera();
    this.rosService.setPreviewSize(640, 480);
  }
  
  
  setSize(width: number, height: number, publish: boolean = true) {
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
    const newSize = String(height + 'p' + ' ' + '(' + this.resolution + ')');
    this.selectedSize = newSize;
    if(publish){
      this.isLoading = true; 
      this.rosService.setPreviewSize(width, height);
      setTimeout(() => {
        this.isLoading = false;  // Stop the spinner
      }, 1500);
    }
    
  }

  arraysEqual(a: number[], b: number[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

  startCamera(){
    this.rosService.subscribeCameraTopic();
  }

  stopCamera(){
    this.rosService.unsubscribeCameraTopic();
    // this.imageSrc = '../../assets/camera-placeholder.jpg'
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

  updateRefreshRateLabel(sliderNumber : number){
    this.refreshRateControl = sliderNumber;
  }

  updateQualityFactorLabel(sliderNumber : number){
    this.qualityFactorControl = sliderNumber;
  }

  removeCssClass(){
    const videoSettingsButton = document.getElementById('videosettings');
    videoSettingsButton?.classList.remove('showPopover');
  }
  addCssClass(){
    const videoSettingsButton = document.getElementById('videosettings');
    videoSettingsButton?.classList.add('showPopover');
  }


  //Boilerplate? Bessere Lösung gegebenenfalls möglich z.B. pass RosServer.function ?)
  qualityControlPublish = (formControlValue : number) => {
    this.rosService.setQualityFactor(formControlValue);
  }
  refreshRatePublish = (formControlValue : number) => {
    this.rosService.setTimerPeriod(formControlValue);
  }

}