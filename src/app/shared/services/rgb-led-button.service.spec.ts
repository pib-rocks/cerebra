import {TestBed} from "@angular/core/testing";

import {RgbLedButtonService} from "./rgb-led-button.service";
import {ApiService} from "./api.service";

describe("RgbLedButtonService", () => {
    let service: RgbLedButtonService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        apiServiceSpy = jasmine.createSpyObj("ApiService", [
            "get",
            "post",
            "put",
            "delete",
        ]);
        TestBed.configureTestingModule({
            providers: [{provide: ApiService, useValue: apiServiceSpy}],
        });
        service = TestBed.inject(RgbLedButtonService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
