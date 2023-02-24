import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import * as ROSLIB from 'roslib';

import { SliderComponent } from './slider.component';

fdescribe('FingerSliderComponent', () => {
  let component: SliderComponent;
  let fixture: ComponentFixture<SliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SliderComponent ],
      imports: [ ReactiveFormsModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a maximum range at 1000', () => {
    const slider = fixture.debugElement.query(By.css('input')).nativeElement;
    expect(slider.max).toBe('1000');
  });

  it('should have a mininum range at -1000', () => {
    const slider = fixture.debugElement.query(By.css('input')).nativeElement;
    expect(slider.min).toBe('-1000');
  });

  xit('should have a topic', () => {
    expect(component.topicName).toBeTruthy();
  });

  it('should call sendMessage() on input', () => {
    spyOn(component, 'sendMessage');
    const slider = fixture.nativeElement.querySelector('input[type="range"]');
    slider.value = 50;
    slider.dispatchEvent(new Event('input'));
    expect(component.sendMessage).toHaveBeenCalled();
  });

  it('should change value after receiving a message', () => {
    const slider = fixture.nativeElement.querySelector('input[type="range"]');

    const message: ROSLIB.Message = {data:'50'};
    const jsonStr = JSON.stringify(message);
    const json = JSON.parse(jsonStr);
    const value = Number(json["data"]);

    component.messageReceiver.next(value);

    fixture.detectChanges();
    expect(slider.value).toBe('50');
  });
});
