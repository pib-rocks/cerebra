import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FingerService } from '../shared/finger.service';
import { RosService } from '../shared/ros.service';

import { SliderComponent } from './slider.component';

fdescribe('SliderComponent', () => {
  let component: SliderComponent;
  let fixture: ComponentFixture<SliderComponent>;
  let rosService: RosService;
  let fingerService: FingerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SliderComponent ],
      imports: [ ReactiveFormsModule ],
      providers: [ RosService, FingerService ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    rosService = TestBed.inject(RosService);
    fingerService = TestBed.inject(FingerService);
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

  it('should call sendMessage() on input', () => {
    spyOn(component, 'sendMessage').and.callThrough();
    spyOn(rosService, 'sendMessage');
    const slider = fixture.nativeElement.querySelector('input[type="range"]');
    slider.value = 50;
    slider.dispatchEvent(new Event('input'));
    expect(component.sendMessage).toHaveBeenCalled();
    expect(rosService.sendMessage).toHaveBeenCalled();
  });

  it('should call sendMessage() to all finger topics on input from combined slider', () => {
    component.isGroup = true;
    component.labelName = 'Open/Close all fingers';
    component.groupSide = 'left';
    component.formControl.setValue(500);
    fixture.detectChanges();
    const fingerTopics = fingerService.getFingerTopics(component.groupSide);
    spyOn(component, 'sendMessage').and.callThrough();
    spyOn(rosService, 'sendMessage');

    const slider = fixture.nativeElement.querySelector('input[type="range"]');
    slider.dispatchEvent(new Event('input'));
    expect(component.sendMessage).toHaveBeenCalled();
    fingerTopics.forEach(t => {
      expect(rosService.sendMessage).toHaveBeenCalledWith(t, 500);
    })
  });

  it('should change value after receiving a message', () => {
    const slider = fixture.nativeElement.querySelector('input[type="range"]');

    component.messageReceiver$.next(500);

    fixture.detectChanges();
    expect(slider.value).toBe('500');
  });

  it('should set a valid value after receiving a message', () => {
    const slider = fixture.nativeElement.querySelector('input[type="range"]');

    component.messageReceiver$.next(5000);
    fixture.detectChanges();
    expect(slider.value).toBe(String(component.maxRange));

    component.messageReceiver$.next(-5000);
    fixture.detectChanges();
    expect(slider.value).toBe(String(component.minRange));
  });
});
