import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
<<<<<<< HEAD
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FingerService } from '../shared/finger.service';
=======
import { MotorService } from '../shared/motor.service';
>>>>>>> 31f6fe6 (refactor: use a single topic for all messages and sliders)
import { RosService } from '../shared/ros.service';

import { SliderComponent } from './slider.component';

fdescribe('SliderComponent', () => {
  let component: SliderComponent;
  let fixture: ComponentFixture<SliderComponent>;
  let rosService: RosService;
<<<<<<< HEAD
  let fingerService: FingerService;
  let modalService: NgbModal;
=======
  let fingerService: MotorService;
>>>>>>> 31f6fe6 (refactor: use a single topic for all messages and sliders)

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SliderComponent ],
      imports: [ ReactiveFormsModule ],
      providers: [ RosService, MotorService ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    rosService = TestBed.inject(RosService);
<<<<<<< HEAD
    fingerService = TestBed.inject(FingerService);
    modalService = TestBed.inject(NgbModal);
=======
    fingerService = TestBed.inject(MotorService);
>>>>>>> 31f6fe6 (refactor: use a single topic for all messages and sliders)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a maximum range at 1000', () => {
    const slider = fixture.debugElement.queryAll(By.css('input'))[1].nativeElement;
    expect(slider.max).toBe('1000');
  });

  it('should have a mininum range at -1000', () => {
    const slider = fixture.debugElement.queryAll(By.css('input'))[1].nativeElement;
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
    component.isCombinedSlider = true;
    component.groupSide = 'left';
    component.sliderFormControl.setValue(500);
    fixture.detectChanges();
    const fingerTopics = fingerService.getMotorNames(component.groupSide);
    spyOn(component, 'sendMessage').and.callThrough();
    spyOn(rosService, 'sendMessage');

    const slider = fixture.nativeElement.querySelector('input[type="range"]');
    slider.dispatchEvent(new Event('input'));
    expect(component.sendMessage).toHaveBeenCalled();
    fingerTopics.forEach(t => {
      expect(rosService.sendMessage).toHaveBeenCalledWith(t);
    })
  });

  it('should change value after receiving a message', () => {
    const slider = fixture.nativeElement.querySelector('input[type="range"]');
<<<<<<< HEAD

    component.messageReceiver$.next(500);

=======
    const json = {
      motor: "thumb_left_stretch",
      value: '500'
    }
    component.messageReceiver$.next(json);

>>>>>>> 31f6fe6 (refactor: use a single topic for all messages and sliders)
    fixture.detectChanges();
    expect(slider.value).toBe('500');
  });

  it('should set a valid value after receiving a message', () => {
    const slider = fixture.nativeElement.querySelector('input[type="range"]');
<<<<<<< HEAD
    component.messageReceiver$.next(5000);
    fixture.detectChanges();
    expect(slider.value).toBe(String(component.maxRange.value));
    component.messageReceiver$.next(-5000);
=======

    let json = {
      motor: "thumb_left_stretch",
      value: '5000'
    }

    component.messageReceiver$.next(json);
    fixture.detectChanges();
    expect(slider.value).toBe(String(component.maxRange));

    json = {
      motor: "thumb_left_stretch",
      value: '-5000'
    }

    component.messageReceiver$.next(json);
>>>>>>> 31f6fe6 (refactor: use a single topic for all messages and sliders)
    fixture.detectChanges();
    expect(slider.value).toBe(String(component.minRange.value));
  });
it('should open dialog when the button has been clicked', () => {
  const spyPopup = spyOn(component,'openPopup').and.callThrough();
  const spyModal = spyOn(modalService,'open');
  const button = fixture.debugElement.query(By.css('#dialogBtn'));
  button.nativeElement.click();
  expect(spyPopup).toHaveBeenCalled();
  expect(spyModal).toHaveBeenCalled();
})
it('should return dismiss reason by clicking on a backdrop', fakeAsync(() => {
  spyOn(component,'openPopup').and.callThrough();
  spyOn(modalService,'open').and.callThrough();
  const button = fixture.debugElement.query(By.css('#dialogBtn'));
  button.nativeElement.click();
  modalService.dismissAll(ModalDismissReasons.BACKDROP_CLICK);
  tick(1000);
  expect(component.closeResult).toBe('Dismissed by clicking on a backdrop');
}));

it('should return dismiss reason by pressing ESC', fakeAsync(() => {
  spyOn(component,'openPopup').and.callThrough();
  spyOn(modalService,'open').and.callThrough();
  const button = fixture.debugElement.query(By.css('#dialogBtn'));
  button.nativeElement.click();
  modalService.dismissAll(ModalDismissReasons.ESC);
  tick(1000);
  expect(component.closeResult).toBe('Dismissed by pressing ESC');
}));

it('should print the status of the motor to the console when checking the checkbox', () => {
  const spyMotor = spyOn(component,'turnTheMotorOnAndOff').and.callThrough();
  const spyConsole = spyOn(console,'log');
  const input = fixture.debugElement.query(By.css('input')).nativeElement;
  const mockEvent = new Event('change');
  input.dispatchEvent(mockEvent);
  expect(spyMotor).toHaveBeenCalledOnceWith(mockEvent);
  expect(spyConsole).toHaveBeenCalledWith('the motor is turned on');
})

});
