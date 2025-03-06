import {TestBed} from "@angular/core/testing";

import {BrickletService} from "./bricklet.service";

describe("BrickletService", () => {
    let service: BrickletService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(BrickletService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
