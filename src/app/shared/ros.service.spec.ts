import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { RosService } from './ros.service';

describe('RosService', () => {
  let service: RosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send a massege', fakeAsync(() => {
    const spy = spyOn(service, 'createTopic');
    let subject = new Subject<number>();
    service.subscribeTopic('test',subject);
    tick();

    expect(spy).toHaveBeenCalled();
  }))



});

