import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RosService } from '../shared/ros.service';

import { SliderComponent } from './slider.component';

fdescribe('SliderComponent', () => {
  let component: SliderComponent;
  let fixture: ComponentFixture<SliderComponent>;
  let rosService: RosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SliderComponent ],
      imports: [ ReactiveFormsModule ],
      providers: [ RosService ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    rosService = TestBed.inject(RosService);
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
