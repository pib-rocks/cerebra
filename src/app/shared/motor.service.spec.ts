import { TestBed } from '@angular/core/testing';

import { MotorService } from './motor.service';

describe('MotorService', () => {
  let service: MotorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MotorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
