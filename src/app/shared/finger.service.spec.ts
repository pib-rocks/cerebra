import { TestBed } from '@angular/core/testing';

import { FingerService } from './finger.service';

describe('FingerService', () => {
  let service: FingerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FingerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
