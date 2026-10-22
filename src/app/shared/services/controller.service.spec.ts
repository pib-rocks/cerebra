import {TestBed} from "@angular/core/testing";
import {ControllerService} from "./controller.service";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {of} from "rxjs";

describe("ControllerService", () => {
    let service: ControllerService;
    let apiService: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        apiService = jasmine.createSpyObj("ApiService", ["put", "get"]);
        apiService.put.and.returnValue(
            of({
                number: 2,
                kind: "feetech_st_serial",
                deviceType: null,
                address: "WS-4A2F",
                supplyVoltage: null,
            }),
        );

        TestBed.configureTestingModule({
            providers: [
                ControllerService,
                {provide: ApiService, useValue: apiService},
            ],
        });
        service = TestBed.inject(ControllerService);
    });

    it("writes one controller's address on the controller it belongs to (PC-124)", () => {
        let stored: unknown;
        service.updateAddress(2, "WS-4A2F").subscribe((row) => (stored = row));

        expect(apiService.put).toHaveBeenCalledOnceWith(
            `${UrlConstants.CONTROLLER}/2`,
            {address: "WS-4A2F"},
        );
        expect(stored).toEqual(
            jasmine.objectContaining({number: 2, address: "WS-4A2F"}),
        );
    });

    it("sends an empty string to clear an identifier", () => {
        service.updateAddress(3, "").subscribe();

        expect(apiService.put).toHaveBeenCalledOnceWith(
            `${UrlConstants.CONTROLLER}/3`,
            {address: ""},
        );
    });

    it("reads connected serial controllers from the hardware", () => {
        apiService.get.and.returnValue(
            of({
                controllers: [
                    {
                        serial: "WS-4A2F",
                        port: "a",
                        kind: "feetech_st_serial",
                        name: "Waveshare adapter",
                    },
                ],
            }),
        );
        let devices: unknown;
        service.getConnectedControllers().subscribe((rows) => (devices = rows));

        expect(apiService.get).toHaveBeenCalledOnceWith(
            UrlConstants.CONTROLLER_CONNECTED,
        );
        expect(devices).toEqual([
            jasmine.objectContaining({serial: "WS-4A2F"}),
        ]);
    });
});
