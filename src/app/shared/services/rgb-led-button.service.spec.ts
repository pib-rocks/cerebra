import {TestBed} from "@angular/core/testing";

import {RgbLedButtonService} from "./rgb-led-button.service";
import {ApiService} from "./api.service";
import {RosService} from "./ros-service/ros.service";
import {of} from "rxjs";

describe("RgbLedButtonService", () => {
    let service: RgbLedButtonService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;
    let rosServiceSpy: jasmine.SpyObj<RosService>;

    beforeEach(() => {
        apiServiceSpy = jasmine.createSpyObj("ApiService", [
            "get",
            "post",
            "put",
            "delete",
        ]);
        rosServiceSpy = jasmine.createSpyObj("RosService", [
            "refreshButtonColors",
        ]);
        TestBed.configureTestingModule({
            providers: [
                {provide: ApiService, useValue: apiServiceSpy},
                {provide: RosService, useValue: rosServiceSpy},
            ],
        });
        service = TestBed.inject(RgbLedButtonService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should refresh button colors after a successful update", () => {
        apiServiceSpy.put.and.returnValue(of({buttonPrograms: []}));
        service.updateButtonPrograms([]).subscribe();
        expect(rosServiceSpy.refreshButtonColors).toHaveBeenCalledTimes(1);
    });
});
