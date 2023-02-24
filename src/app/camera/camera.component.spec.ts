import { ComponentFixture, TestBed, tick, fakeAsync, waitForAsync } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, FormControlDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CameraComponent } from './camera.component';

fdescribe('CameraComponent', () => {
  let component: CameraComponent;
  let fixture: ComponentFixture<CameraComponent>;
  let formControl: FormControl;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ CameraComponent ],
      imports: [ReactiveFormsModule],
      providers: [FormControlDirective]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CameraComponent);
    component = fixture.componentInstance;
    formControl = component.refreshRateControl;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a silder step of 0.05', () => {
    const slider = fixture.nativeElement.querySelector('#refreshRate');
    expect(slider.step).toBe('0.05');
  });

  it('should have a maximum range at 1', () => {
    const slider = fixture.nativeElement.querySelector('#refreshRate');
    expect(slider.max).toBe('1');
  });

  it('should have a mininum range at 0.1', () => {
    const slider = fixture.nativeElement.querySelector('#refreshRate');
    expect(slider.min).toBe('0.1');
  });

  it('should display an image that is loaded', (done: DoneFn) => {
    const imgElement = fixture.nativeElement.querySelector('img');
    expect(imgElement).toBeTruthy();

    imgElement.onload = () => {
      expect(imgElement.complete).toBe(true);
      expect(imgElement.naturalWidth).toBeGreaterThan(0);
      done();
    };
  });

  it('should bind slider to a FormControl', fakeAsync(() => {
    const slider = fixture.debugElement.nativeElement.querySelector('#refreshRate');
    expect(slider.value).toBe(formControl.value + '');
    slider.value = slider.value - 0.05;
    slider.dispatchEvent(new Event('input'));
    tick();
    expect(slider.value).toBe(formControl.value + '');
  }));
});
