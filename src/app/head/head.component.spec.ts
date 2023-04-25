import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeadComponent } from './head.component';
import { RosService } from '../shared/ros.service';
import { By } from '@angular/platform-browser';
import { SliderComponent } from '../slider/slider.component';
import { ReactiveFormsModule } from '@angular/forms';

describe('HeadComponent', () => {
  let component: HeadComponent;
  let fixture: ComponentFixture<HeadComponent>;
  let rosService: RosService;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeadComponent, SliderComponent ],
      imports: [ReactiveFormsModule],
      providers: [RosService]

    })
    .compileComponents();

    fixture = TestBed.createComponent(HeadComponent);
    component = fixture.componentInstance;
    rosService = TestBed.inject(RosService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send dummy values', () => {
    fixture.detectChanges();
    const dummyBtnLEft = fixture.debugElement.query(By.css('#dummyBtn'));
    spyOn(rosService,'sendMessage');
    dummyBtnLEft.nativeElement.click();
    expect(rosService.sendMessage).toHaveBeenCalledTimes(2);
});

it('should call reset() and set all slider values to 0 after clicking reset button', () => {
  const sliders = fixture.debugElement.queryAll(By.css('app-slider'));
  for (const slider of sliders) {
    spyOn(slider.componentInstance, 'sendMessage');
  }

  spyOn(component, 'reset').and.callThrough();

  const button = fixture.nativeElement.querySelector('#resetButton');
  spyOn(button, 'dispatchEvent').and.callThrough();
  for (const c of sliders){
    c.componentInstance.sliderFormControl.setValue(10);
  }
  button.dispatchEvent(new MouseEvent('click'));
  fixture.detectChanges();
  expect(button.dispatchEvent).toHaveBeenCalledWith(new MouseEvent('click'));
  expect(component.reset).toHaveBeenCalled();

  for (const slider of sliders) {
    if (slider.componentInstance.showMotorSettingsButton === true){
      const input = slider.children[1].children[2];
      expect(input.nativeElement.value).toBe("0");
      expect(slider.componentInstance.sendMessage).toHaveBeenCalled();
    }
  }
})
});
