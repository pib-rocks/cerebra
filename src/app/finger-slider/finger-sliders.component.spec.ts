import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FingerSlidersComponent } from './finger-sliders.component';

describe('FingerSliderComponent', () => {
  let component: FingerSlidersComponent;
  let fixture: ComponentFixture<FingerSlidersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FingerSlidersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FingerSlidersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
