import { Component, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css']
})
export class CameraComponent {

  @ViewChild('videoElement') videoElement: any;
  navigator!: Navigator;
  stream!: MediaStream;


  componentName = "Live view";

  sliderTrigger$ = new Subject<string>();
  refreshRateControl = new FormControl(0.5);
  selectedSize = '480p';

  setActive(event: MouseEvent) {
    const target = event.target as HTMLAnchorElement;

    const items = target.parentElement?.parentElement?.querySelectorAll(".dropdown-item") as NodeListOf<HTMLAnchorElement>;
    items.forEach(item => item.classList.remove('active'));

    target.classList.add('active');
    this.selectedSize = target.textContent ?  target.textContent.split(' ')[0] : '';
  }

  startCamera() {
    this.navigator = <Navigator>navigator;
    this.navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const deviceId = videoDevices[0].deviceId;
        const constraints = { video: { deviceId: { exact: deviceId } } };
        return this.navigator.mediaDevices.getUserMedia(constraints);
      })
      .then(stream => {
        this.stream = stream;
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.play();
      })
      .catch(err => console.error(err));
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.videoElement.nativeElement.srcObject = null;
    }
  }

}
