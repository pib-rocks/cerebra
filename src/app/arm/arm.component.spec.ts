import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from '../app-routing.module';
import { SliderComponent } from '../slider/slider.component';

import { ArmComponent } from './arm.component';

fdescribe('ArmComponent', () => {
  let component: ArmComponent;
  let fixture: ComponentFixture<ArmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArmComponent, SliderComponent ],
      imports: [AppRoutingModule, ReactiveFormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create 4 child components that include the slider', () => {
    component.side = 'left';
    fixture.detectChanges();
    const childComponents = fixture.nativeElement.querySelectorAll('app-slider');
    expect(childComponents.length).toBe(4);
  });

  
});
