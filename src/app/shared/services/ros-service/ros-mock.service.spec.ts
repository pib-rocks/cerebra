import {TestBed} from "@angular/core/testing";

import {RosMockService} from "./ros-mock.service";

describe("RosMockService", () => {
    let service: RosMockService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RosMockService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
