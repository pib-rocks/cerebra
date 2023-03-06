import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
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
    console.log(childComponents);
    expect(childComponents.length).toBe(4);
  });

  it('should call reset() and set all slider values to 0 after clicking reset button', () => {
    component.side = 'left';
    fixture.detectChanges();
    const childComponents = fixture.debugElement.queryAll(By.css('app-slider'));
    const spies: jasmine.Spy<any>[] = [];
    for (const childComponent of childComponents) {
      spies.push(spyOn(childComponent.componentInstance, 'sendMessage'));
    }
    const button = fixture.debugElement.query(By.css('#resetButton'));
    console.log(button);
    const clickSpy = spyOn(component,'reset').and.callThrough();
    for (const c of childComponents){
      c.componentInstance.silderFormControl.setValue(10);
    }
    button.nativeElement.click();
    expect(clickSpy).toHaveBeenCalled();
    for (const child of childComponents){
      expect(child.componentInstance.silderFormControl.value).toBe(0);
    }
    for(const spy of spies){
      expect(spy).toHaveBeenCalled();
    }
  })

  
});
