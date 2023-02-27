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
      console.log(slider.componentInstance.topicName);
      expect(slider.componentInstance.topicName).toBeTruthy();
    }
  });
});
