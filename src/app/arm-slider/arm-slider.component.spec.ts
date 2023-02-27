import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { ArmSliderComponent } from './arm-slider.component';

fdescribe('LeftArmComponent', () => {
  let component: ArmSliderComponent;
  let fixture: ComponentFixture<ArmSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArmSliderComponent ],
      imports: [ ReactiveFormsModule ]

    })
    .compileComponents();

    fixture = TestBed.createComponent(ArmSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call sendMessage when the input event is triggered', () => {
    spyOn(component, 'sendMessage');

    const input = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('input'));
    input.value = 10;
    console.log(input.value);
    expect(component.sendMessage).toHaveBeenCalled();
  });



});
