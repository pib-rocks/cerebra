import { Component, ElementRef, Input, ViewChild, Output, EventEmitter, OnInit, AfterViewInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { RosService } from "../shared/ros.service";
import { Message } from "../shared/message";
import { Subject } from "rxjs";
@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit, AfterViewInit {

  @ViewChild('bubble') bubbleElement!: ElementRef;
  @ViewChild('bubbleInput') bubbleInput!: ElementRef;
  @ViewChild('range') sliderElem!: ElementRef;

  @Input() sliderName : string = "";
  @Input() minValue : number = 0;
  @Input() maxValue : number = 100;
  @Input() defaultValue : number = (this.minValue + this.maxValue)/2;
  @Input() step : number = 1;
  @Input() unitOfMeasurement : string = "";
  
  //PR-157
  @Input() publishMessage!: (args: number) => void;
  @Input() messageReceiver$! : Subject<any>;
  //

  sliderFormControl: FormControl = new FormControl();
  bubbleFormControl: FormControl = new FormControl();

  timer: any = null;

  bubblePosition!: number;
  closeResult!: string;
  isCombinedSlider = false;
  isInputVisible = false;
  maxBubblePosition = 100;
  minBubblePosition = 0;
  pixelsFromEdge = 60;
  imageSrc!: string;
  @Output() sliderEvent = new EventEmitter<number>();

  constructor(
    private rosService: RosService
  ) { }

  ngOnInit(): void {
    this.messageReceiver$.subscribe((value) => {
      if (value) {
        this.sliderFormControl.setValue(this.getValueWithinRange(Number(value)));
        this.setThumbPosition();
      }
    });
    this.sliderFormControl.setValue(this.getValueWithinRange(Number(this.defaultValue)));
    this.bubbleFormControl.setValue(this.getValueWithinRange(Number(this.defaultValue)));
    console.log("init: " + this.sliderName);
  }


  ngAfterViewInit() {
    const sliderWidth = document.getElementById("slider_"+this.sliderName)?.clientWidth;
    if (sliderWidth !== undefined) {
      this.minBubblePosition = this.pixelsFromEdge*100/sliderWidth;
      this.maxBubblePosition = (sliderWidth-this.pixelsFromEdge)*100/sliderWidth;
    }
    this.setThumbPosition();
  }

  setSliderValue(value: number) {
    this.sliderFormControl.setValue(value);
    this.setThumbPosition();
  }

  inputSendMsg(): void {
    if(this.sliderFormControl.value !== null){
      this.timer = setTimeout(() => {
        this.publishMessage(Number(this.sliderFormControl.value));
      }, 500);
    }
  }

  sendMessage() {
    this.sliderEvent.emit(this.sliderFormControl.value);
    const message: Message = {
      motor: this.sliderName,
      value: this.sliderFormControl.value,
    };
    this.rosService.sendSliderMessage(message);
  }

  toggleInputVisible() {
    if(this.sliderFormControl.value !== null){
      this.isInputVisible = !this.isInputVisible;
      this.setSliderValue(this.bubbleFormControl.value);
      setTimeout(()=>{
        this.bubbleInput.nativeElement.focus();
        this.bubbleInput.nativeElement.select();
      }, 0)
    } else{
      this.isInputVisible = !this.isInputVisible;
    }
  }

  toggleInputUnvisible() {
    if (this.bubbleFormControl.value !== this.sliderFormControl.value) {
      if(this.sliderFormControl.value !== null){
        this.isInputVisible = !this.isInputVisible;
        if(this.bubbleFormControl.hasError('min')) {
          this.setSliderValue(this.minValue);
          this.inputSendMsg();
        }
        else if(this.bubbleFormControl.hasError('max')) {
          this.setSliderValue(this.maxValue);
          this.inputSendMsg();
        }
        else if(this.bubbleFormControl.hasError('required')) {
          this.bubbleFormControl.setValue(this.sliderFormControl.value);
        }
        else if(this.bubbleFormControl.hasError('pattern')) {
          this.bubbleFormControl.setValue(this.sliderFormControl.value);
        }
        else {
          console.log("???");
          this.setSliderValue(this.bubbleFormControl.value);
          this.inputSendMsg();
        }
      } 
    } else {
      this.isInputVisible = !this.isInputVisible;
    }
  }

  getValueWithinRange(value: number) {
    let validVal;
    if (value > this.maxValue) {
      validVal = this.maxValue;
    } else if (value < this.minValue) {
      validVal = this.minValue;
    } else {
      validVal = value;
    }
    return validVal;
  } 

  setThumbPosition() {
    const val = (this.sliderFormControl.value - this.minValue)*100 / (this.maxValue - this.minValue);
    setTimeout(() => {
      this.bubblePosition = val;
    },0);
    this.bubbleFormControl.setValue(this.sliderFormControl.value);
    this.bubbleElement.nativeElement.style.left = `calc(${val}%)`;
    this.sliderElem.nativeElement.style.setProperty("--pos-relative", val.toString(10)+'%');
  }

}
