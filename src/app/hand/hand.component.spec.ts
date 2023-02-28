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

  it('should contain 6 sliders with their own topic', () => {
    component.side = 'left';
    fixture.detectChanges();
    const sliders = fixture.debugElement.queryAll(By.css('app-slider'));
    expect(sliders.length).toBe(6);
    for (const slider of sliders) {
      expect(slider.componentInstance.topicName).toBeTruthy();
    }
  });

  it('should call reset() and set all slider values to 0 after clicking reset button', () => {
    component.side = 'left';
    fixture.detectChanges();

    const sliders = fixture.debugElement.queryAll(By.css('app-slider'));
    for (const slider of sliders) {
      const input = slider.children[1];
      spyOn(input.nativeElement, 'dispatchEvent');
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
      expect(input.nativeElement.dispatchEvent).toHaveBeenCalledWith(new Event('input'));
    }
  })
});
