import {TestBed} from "@angular/core/testing";
import {of} from "rxjs";
import {SmartHomeService} from "./smart-home.service";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {
    MatterCommissionRequest,
    SmartHomeDevice,
    SmartHomeHubStatus,
} from "../types/smart-home";

describe("SmartHomeService", () => {
    let service: SmartHomeService;
    let apiService: jasmine.SpyObj<ApiService>;

    const hubStatus: SmartHomeHubStatus = {
        homeAssistant: {
            online: true,
            url: "http://localhost:8123",
            onboardingComplete: true,
            profile: "minimal-in-memory",
            memoryCapMib: 384,
        },
        matterServer: {
            online: true,
            url: "ws://localhost:5580",
            memoryCapMib: 192,
        },
        deviceCount: 2,
        voiceExposedCount: 1,
    };

    const device: SmartHomeDevice = {
        entityId: "light.kitchen",
        domain: "light",
        friendlyName: "Kitchen",
        room: "Kitchen",
        exposeToVoice: true,
        exposeToPrograms: true,
        state: "on",
        attributes: {brightness: 80},
        online: true,
    };

    beforeEach(() => {
        apiService = jasmine.createSpyObj("ApiService", [
            "get",
            "post",
            "put",
            "delete",
        ]);
        TestBed.configureTestingModule({
            providers: [{provide: ApiService, useValue: apiService}],
        });
        service = TestBed.inject(SmartHomeService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("getStatus should GET /smart-home/status", () => {
        apiService.get.and.returnValue(of(hubStatus));
        service.getStatus().subscribe((status) => {
            expect(status).toEqual(hubStatus);
        });
        expect(apiService.get).toHaveBeenCalledWith(
            `${UrlConstants.SMART_HOME}/status`,
        );
    });

    it("initializeHub should POST /smart-home/initialize", () => {
        apiService.post.and.returnValue(of(hubStatus));
        service.initializeHub().subscribe((status) => {
            expect(status).toEqual(hubStatus);
        });
        expect(apiService.post).toHaveBeenCalledWith(
            `${UrlConstants.SMART_HOME}/initialize`,
            {},
        );
    });

    it("getDevices should GET /smart-home/devices without room", () => {
        apiService.get.and.returnValue(of({devices: [device]}));
        service.getDevices().subscribe((response) => {
            expect(response.devices).toEqual([device]);
        });
        expect(apiService.get).toHaveBeenCalledWith(
            `${UrlConstants.SMART_HOME}/devices`,
        );
    });

    it("getDevices should GET /smart-home/devices with room query", () => {
        apiService.get.and.returnValue(of({devices: [device]}));
        service.getDevices("Kitchen").subscribe();
        expect(apiService.get).toHaveBeenCalledWith(
            `${UrlConstants.SMART_HOME}/devices?room=Kitchen`,
        );
    });

    it("updateDevice should PUT encoded entity id", () => {
        apiService.put.and.returnValue(of(device));
        service
            .updateDevice("light.kitchen", {exposeToVoice: false})
            .subscribe((updated) => {
                expect(updated).toEqual(device);
            });
        expect(apiService.put).toHaveBeenCalledWith(
            `${UrlConstants.SMART_HOME}/devices/${encodeURIComponent(
                "light.kitchen",
            )}`,
            {exposeToVoice: false},
        );
    });

    it("deleteDevice should DELETE encoded entity id", () => {
        apiService.delete.and.returnValue(
            of({deleted: true, entityId: "light.kitchen"}),
        );
        service.deleteDevice("light.kitchen").subscribe((result) => {
            expect(result.deleted).toBeTrue();
        });
        expect(apiService.delete).toHaveBeenCalledWith(
            `${UrlConstants.SMART_HOME}/devices/${encodeURIComponent(
                "light.kitchen",
            )}`,
        );
    });

    it("executeAction should POST action body without value", () => {
        apiService.post.and.returnValue(
            of({action: "turn_off", applied: true, device}),
        );
        service.executeAction("light.kitchen", "turn_off").subscribe();
        expect(apiService.post).toHaveBeenCalledWith(
            `${UrlConstants.SMART_HOME}/devices/${encodeURIComponent(
                "light.kitchen",
            )}/action`,
            {action: "turn_off"},
        );
    });

    it("executeAction should POST action body with value", () => {
        apiService.post.and.returnValue(
            of({action: "set_brightness", applied: true, device}),
        );
        service
            .executeAction("light.kitchen", "set_brightness", 50)
            .subscribe();
        expect(apiService.post).toHaveBeenCalledWith(
            `${UrlConstants.SMART_HOME}/devices/${encodeURIComponent(
                "light.kitchen",
            )}/action`,
            {action: "set_brightness", value: 50},
        );
    });

    it("commissionMatterDevice should POST matter commission payload", () => {
        const payload: MatterCommissionRequest = {
            pairingCode: "3497-011-2332",
            friendlyName: "Lamp",
            room: "Living Room",
            domain: "light",
        };
        apiService.post.and.returnValue(of({commissioned: true, device}));
        service.commissionMatterDevice(payload).subscribe((response) => {
            expect(response.commissioned).toBeTrue();
        });
        expect(apiService.post).toHaveBeenCalledWith(
            `${UrlConstants.SMART_HOME}/matter/commission`,
            payload,
        );
    });
});
