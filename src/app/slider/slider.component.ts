import { AfterViewInit, Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { Output, EventEmitter } from '@angular/core'; 
import { FormControl, Validators } from "@angular/forms";
import { RosService } from "../shared/ros.service";
import { notNullValidator } from "../shared/validators";
import { timeout } from "rxjs";
@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent {

  @ViewChild('bubble') bubbleElement!: ElementRef;
  @ViewChild('bubbleInput') bubbleInput!: ElementRef;
  @ViewChild('range') sliderElem!: ElementRef;

  @Input() sliderName : string = "";
  @Input() minSliderValue : number = -9000;
  @Input() maxSliderValue : number = 9000;
  @Input() sliderStep = "";
  @Input() sliderValue = "";
  @Input() minValue : number = 0;
  @Input() maxValue : number = 100;
  @Input() defaultValue : number = (this.minValue + this.maxValue)/2;
  @Input() step : number = 1;
  @Input() unitOfMeasurement : string = "°";

  

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
  // messageReceiver$ = new Subject<Message>();
  oldValue: number = 0;

  ngOnInit(): void {
    console.log(this.defaultValue);
    // Todo: Warten auf BubbleElement weil ansonsten Undefined Fehler
    setTimeout(() => {
      this.setSliderValue(this.getValueWithinRange(Number(this.defaultValue)));
    }, 500);
  }


  ngAfterViewInit() {
    const sliderWidth = document.getElementById("slider_"+this.sliderName)?.clientWidth;
    if (sliderWidth !== undefined) {
      this.minBubblePosition = this.pixelsFromEdge*100/sliderWidth;
      this.maxBubblePosition = (sliderWidth-this.pixelsFromEdge)*100/sliderWidth;
    }
  }

  @Output() sliderEvent = new EventEmitter<number>();

  setSliderValue(value: number) {
    this.sliderFormControl.setValue(value);
    this.setThumbPosition();
    this.sendMessage();
  }

  inputSendMsg(): void {
    if(this.sliderFormControl.value !== null){
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.sendMessage();
      }, 500);
    }
  }

  sendMessage() {
    this.sliderEvent.emit(this.sliderFormControl.value);
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
    console.log("SliderCom:" + this.sliderFormControl.value);
    const val = (this.sliderFormControl.value - this.minValue)*100 / (this.maxValue - this.minValue);
    setTimeout(() => {
      this.bubblePosition = val;
    },0);
    this.bubbleFormControl.setValue(this.sliderFormControl.value);
    this.bubbleElement.nativeElement.style.left = `calc(${val}%)`;
    this.sliderElem.nativeElement.style.setProperty("--pos-relative", val.toString(10)+'%');
  }





}
