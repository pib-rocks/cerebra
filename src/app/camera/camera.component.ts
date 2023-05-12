import { Component, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Subject } from "rxjs";
import * as ROSLIB from "roslib";
import { RosService } from "../shared/ros.service";

@Component({
  selector: "app-camera",
  templateUrl: "./camera.component.html",
  styleUrls: ["./camera.component.css"],
})
export class CameraComponent {
  @ViewChild("videoElement") videoElement: any;
  navigator!: Navigator;
  stream!: MediaStream;

  componentName = "Live view";

  sliderTrigger$ = new Subject<string>();
  refreshRateControl = new FormControl(0.5);
  selectedSize = "480p";

  private imageTopic!: ROSLIB.Topic;
  private imageSrc: string = "";
  private rbServer: ROSLIB.Ros;

  constructor(private rosService: RosService) {
    this.rbServer = rosService.setUpRos();
  }

  ngOnInit(): void {
    this.rbServer = new ROSLIB.Ros({
      url: "ws://192.168.220.110:9090",
    });
    this.rbServer.on("connection", function () {
      console.log("Connected to ROSBridge server.");
    });

    this.rbServer.on("error", function (error) {
      console.log("Error connecting to ROSBridge server: ", error);
    });

    this.rbServer.on("close", function () {
      console.log("Connection to ROSBridge server closed.");
    });

    this.imageTopic = new ROSLIB.Topic({
      ros: this.rbServer,

      name: "/camera/left/image_raw",

      messageType: "sensor_msgs/Image",
    });

    this.imageTopic.subscribe((message) => {
      console.log(typeof (<any>message).data);

      const imageData = "data:image/jpeg;base64," + (<any>message).data;

      this.imageSrc = imageData;
    });
  }

  setActive(resolutionsize: string) {
    this.selectedSize = resolutionsize;
  }

  startCamera() {
    this.navigator = <Navigator>navigator;
    this.navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const deviceId = videoDevices[0].deviceId;
        const constraints = { video: { deviceId: { exact: deviceId } } };
        return this.navigator.mediaDevices.getUserMedia(constraints);
      })
      .then((stream) => {
        this.stream = stream;
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.play();
      })
      .catch((err) => console.error(err));
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.videoElement.nativeElement.srcObject = null;
    }
  }
}
