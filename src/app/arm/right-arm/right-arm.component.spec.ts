import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RightArmComponent } from './right-arm.component';

describe('RightArmComponent', () => {
  let component: RightArmComponent;
  let fixture: ComponentFixture<RightArmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RightArmComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RightArmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
