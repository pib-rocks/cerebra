import {TestBed} from "@angular/core/testing";

import {RgbLedButtonService} from "./rgb-led-button.service";

describe("RgbLedButtonService", () => {
    let service: RgbLedButtonService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RgbLedButtonService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
