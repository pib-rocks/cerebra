import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArmComponent } from './arm.component';

describe('ArmComponent', () => {
  let component: ArmComponent;
  let fixture: ComponentFixture<ArmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArmComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
