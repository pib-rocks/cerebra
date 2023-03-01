import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { SliderComponent } from '../slider/slider.component';

import { HandComponent } from './hand.component';

fdescribe('HandComponent', () => {
  let component: HandComponent;
  let fixture: ComponentFixture<HandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandComponent, SliderComponent ],
      imports: [ RouterTestingModule, ReactiveFormsModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain 2 sliders with their own topic', () => {
    component.side = 'left';
    fixture.detectChanges();
    const sliders = fixture.debugElement.queryAll(By.css('app-slider'));
    expect(sliders.length).toBe(2);
    for (const slider of sliders) {
      expect(slider.componentInstance.topicName).toBeTruthy();
    }
  });

  it('should call reset() and set all slider values to 0 after clicking reset button', () => {
    component.side = 'left';
    fixture.detectChanges();

    const sliders = fixture.debugElement.queryAll(By.css('app-slider'));
    for (const slider of sliders) {
      spyOn(slider.componentInstance, 'sendMessage');
    }

    spyOn(component, 'reset').and.callThrough();

    const button = fixture.nativeElement.querySelector('#resetButton');
    spyOn(button, 'dispatchEvent').and.callThrough();
    button.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();
    expect(button.dispatchEvent).toHaveBeenCalledWith(new MouseEvent('click'));
    expect(component.reset).toHaveBeenCalled();

    for (const slider of sliders) {
      const input = slider.children[1];
      expect(input.nativeElement.value).toBe("0");
      expect(slider.componentInstance.sendMessage).toHaveBeenCalledWith();
    }
  })

  it('should send value of index finger to all finger topics after switching to 2 sliders', () => {
    component.side = 'left';
    component.switchControl.setValue(true);
    fixture.detectChanges();
    const checkInput = fixture.debugElement.query(By.css('.form-check-input'));
    spyOn(checkInput.componentInstance, 'switchView').and.callThrough();
    const sliders = fixture.debugElement.queryAll(By.css('app-slider'));
    sliders.filter(slider => slider.children[1].componentInstance.labelName !== 'Thumb Opposition')
      .forEach(slider => spyOn(slider.componentInstance, 'sendMessage'));

    sliders.filter(slider => slider.componentInstance.labelName === "Index finger")[0]
      .children[1].componentInstance.formControl.setValue(500);

    checkInput.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(checkInput.componentInstance.switchView).toHaveBeenCalled();

    component.childComponents.filter(child => child.labelName !== 'Thumb opposition').forEach(child => {
      expect(child.formControl.value).toBe(500);
      expect(child.sendMessage).toHaveBeenCalled();
    });
  });
});
