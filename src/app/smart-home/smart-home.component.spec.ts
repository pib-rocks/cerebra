import {provideZonelessChangeDetection} from "@angular/core";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {of, throwError} from "rxjs";
import {SmartHomeComponent} from "./smart-home.component";
import {SmartHomeService} from "src/app/shared/services/smart-home.service";
import {
    SmartHomeDevice,
    SmartHomeHubStatus,
} from "src/app/shared/types/smart-home";

describe("SmartHomeComponent", () => {
    let fixture: ComponentFixture<SmartHomeComponent>;
    let component: SmartHomeComponent;
    let smartHomeService: jasmine.SpyObj<SmartHomeService>;

    const hubStatus: SmartHomeHubStatus = {
        homeAssistant: {
            online: true,
            url: "http://localhost:8123",
            onboardingComplete: true,
            profile: "minimal-in-memory",
            memoryCapMib: 384,
        },
        matterServer: {
            online: false,
            url: "ws://localhost:5580",
            memoryCapMib: 192,
        },
        deviceCount: 1,
        voiceExposedCount: 1,
    };

    const lightDevice: SmartHomeDevice = {
        entityId: "light.kitchen",
        domain: "light",
        friendlyName: "Kitchen Light",
        room: "Kitchen",
        exposeToVoice: true,
        exposeToPrograms: true,
        state: "on",
        attributes: {brightness_pct: 60},
        online: true,
    };

    const coverDevice: SmartHomeDevice = {
        entityId: "cover.blinds",
        domain: "cover",
        friendlyName: "Blinds",
        room: "Living Room",
        exposeToVoice: false,
        exposeToPrograms: true,
        state: "closed",
        attributes: {},
        online: true,
    };

    beforeEach(async () => {
        smartHomeService = jasmine.createSpyObj("SmartHomeService", [
            "getStatus",
            "initializeHub",
            "getDevices",
            "updateDevice",
            "deleteDevice",
            "executeAction",
            "commissionMatterDevice",
        ]);
        smartHomeService.getStatus.and.returnValue(of(hubStatus));
        smartHomeService.getDevices.and.returnValue(
            of({devices: [lightDevice, coverDevice]}),
        );

        await TestBed.configureTestingModule({
            imports: [SmartHomeComponent],
            providers: [
                provideZonelessChangeDetection(),
                {provide: SmartHomeService, useValue: smartHomeService},
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SmartHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create and load devices and hub status", () => {
        expect(component).toBeTruthy();
        expect(smartHomeService.getDevices).toHaveBeenCalled();
        expect(smartHomeService.getStatus).toHaveBeenCalled();
        expect(component.devices).toHaveSize(2);
        expect(component.hubStatus).toEqual(hubStatus);
    });

    it("handles climate temperature adjustments, search by entityId/room, error paths, and newly added devices", () => {
        const climateDevice: SmartHomeDevice = {
            entityId: "climate.thermostat",
            domain: "climate",
            friendlyName: "Thermostat",
            room: "Office",
            exposeToVoice: true,
            exposeToPrograms: true,
            state: "heat",
            attributes: {target_temp: 21},
            online: false,
        };
        const updatedClimate = {
            ...climateDevice,
            attributes: {temperature: 22},
        };
        smartHomeService.executeAction.and.returnValue(
            of({
                action: "set_temperature",
                applied: true,
                device: updatedClimate,
            }),
        );
        component.adjustClimateTemperature(climateDevice, 1);
        expect(smartHomeService.executeAction).toHaveBeenCalledWith(
            "climate.thermostat",
            "set_temperature",
            22,
        );
        expect(component.climateTargetTemperature(updatedClimate)).toBe(22);
        expect(
            component.climateTargetTemperature({
                ...climateDevice,
                attributes: {},
            }),
        ).toBe(20);
        expect(
            component.deviceBrightness({
                ...lightDevice,
                attributes: {brightness: 55},
            }),
        ).toBe(55);
        expect(
            component.deviceBrightness({...lightDevice, attributes: {}}),
        ).toBe(0);
        expect(
            component.isDeviceOn({...coverDevice, state: "open"}),
        ).toBeTrue();
        expect(
            component.isDeviceOn({
                ...coverDevice,
                domain: "lock",
                state: "unlocked",
            }),
        ).toBeTrue();
        expect(component.isToggleDomain("lock")).toBeTrue();
        expect(component.isToggleDomain("scene")).toBeTrue();
        expect(component.isToggleDomain("sensor")).toBeFalse();

        component.onSearchInput({
            target: {value: "living room"},
        } as unknown as Event);
        expect(component.filteredDevices).toEqual([coverDevice]);

        component.onSearchInput({
            target: {value: "light.kitchen"},
        } as unknown as Event);
        expect(component.filteredDevices).toEqual([lightDevice]);

        smartHomeService.getDevices.and.returnValue(
            throwError(() => new Error("err")),
        );
        component.loadDevices();
        expect(component.devicesLoading).toBeFalse();

        smartHomeService.getStatus.and.returnValue(
            throwError(() => new Error("err")),
        );
        component.loadHubStatus();
        expect(component.hubLoading).toBeFalse();

        smartHomeService.initializeHub.and.returnValue(
            throwError(() => new Error("err")),
        );
        component.initializeHub();
        expect(component.hubInitializing).toBeFalse();

        smartHomeService.commissionMatterDevice.and.returnValue(
            of({commissioned: false, device: climateDevice}),
        );
        component.pairingForm.setValue({
            pairingCode: "3497-011-2332",
            friendlyName: "Thermostat",
            room: "Office",
            domain: "climate",
            wifiSsid: "MyWiFi",
            wifiPassword: "secret",
        });
        component.submitPairing();
        expect(component.pairingStatusError).toBeTrue();
    });

    it("should filter devices by room and search", () => {
        component.selectRoom("Kitchen");
        expect(component.filteredDevices).toEqual([lightDevice]);

        component.selectRoom(null);
        component.onSearchInput({
            target: {value: "blinds"},
        } as unknown as Event);
        expect(component.filteredDevices).toEqual([coverDevice]);
    });

    it("distinctRooms should list sorted unique rooms", () => {
        expect(component.distinctRooms).toEqual(["Kitchen", "Living Room"]);
    });

    it("toggleVoiceExposure should call updateDevice", () => {
        const updated = {...lightDevice, exposeToVoice: false};
        smartHomeService.updateDevice.and.returnValue(of(updated));

        component.toggleVoiceExposure(lightDevice);

        expect(smartHomeService.updateDevice).toHaveBeenCalledWith(
            "light.kitchen",
            {exposeToVoice: false},
        );
        expect(component.devices[0].exposeToVoice).toBeFalse();
    });

    it("toggleDevice should turn off when device is on", () => {
        const updated = {...lightDevice, state: "off"};
        smartHomeService.executeAction.and.returnValue(
            of({action: "turn_off", applied: true, device: updated}),
        );

        component.toggleDevice(lightDevice);

        expect(smartHomeService.executeAction).toHaveBeenCalledWith(
            "light.kitchen",
            "turn_off",
        );
        expect(component.devices[0].state).toBe("off");
    });

    it("setBrightness should post brightness action", () => {
        smartHomeService.executeAction.and.returnValue(
            of({action: "set_brightness", applied: true, device: lightDevice}),
        );
        component.setBrightness(lightDevice, {
            target: {value: "40"},
        } as unknown as Event);
        expect(smartHomeService.executeAction).toHaveBeenCalledWith(
            "light.kitchen",
            "set_brightness",
            40,
        );
    });

    it("cover controls should call open and close actions", () => {
        smartHomeService.executeAction.and.returnValue(
            of({action: "open_cover", applied: true, device: coverDevice}),
        );
        component.openCover(coverDevice);
        expect(smartHomeService.executeAction).toHaveBeenCalledWith(
            "cover.blinds",
            "open_cover",
        );

        smartHomeService.executeAction.and.returnValue(
            of({action: "close_cover", applied: true, device: coverDevice}),
        );
        component.closeCover(coverDevice);
        expect(smartHomeService.executeAction).toHaveBeenCalledWith(
            "cover.blinds",
            "close_cover",
        );
    });

    it("deleteDevice should remove device from list", () => {
        smartHomeService.deleteDevice.and.returnValue(
            of({deleted: true, entityId: "light.kitchen"}),
        );
        component.deleteDevice(lightDevice);
        expect(component.devices.map((d) => d.entityId)).toEqual([
            "cover.blinds",
        ]);
    });

    it("initializeHub should refresh hub status and devices", () => {
        smartHomeService.initializeHub.and.returnValue(of(hubStatus));
        component.initializeHub();
        expect(smartHomeService.initializeHub).toHaveBeenCalled();
        expect(smartHomeService.getDevices).toHaveBeenCalledTimes(2);
    });

    it("submitPairing should validate required fields", () => {
        component.pairingForm.reset({
            pairingCode: "",
            friendlyName: "",
            room: "",
            domain: "light",
            wifiSsid: "",
            wifiPassword: "",
        });
        component.submitPairing();
        expect(smartHomeService.commissionMatterDevice).not.toHaveBeenCalled();
        expect(component.pairingStatusError).toBeTrue();
    });

    it("submitPairing should commission device on valid form", () => {
        smartHomeService.commissionMatterDevice.and.returnValue(
            of({commissioned: true, device: lightDevice}),
        );
        component.pairingForm.setValue({
            pairingCode: "3497-011-2332",
            friendlyName: "Kitchen Light",
            room: "Kitchen",
            domain: "light",
            wifiSsid: "",
            wifiPassword: "",
        });
        component.submitPairing();
        expect(smartHomeService.commissionMatterDevice).toHaveBeenCalled();
        expect(component.pairingStatusError).toBeFalse();
        expect(component.pairingStatusMessage).toContain("successfully");
    });

    it("submitPairing should show error when commission fails", () => {
        smartHomeService.commissionMatterDevice.and.returnValue(
            throwError(() => new Error("fail")),
        );
        component.pairingForm.setValue({
            pairingCode: "3497-011-2332",
            friendlyName: "Kitchen Light",
            room: "Kitchen",
            domain: "light",
            wifiSsid: "",
            wifiPassword: "",
        });
        component.submitPairing();
        expect(component.pairingStatusError).toBeTrue();
    });

    it("should switch tabs", () => {
        component.selectTab("hub");
        expect(component.activeTab).toBe("hub");
        component.selectTab("pairing");
        expect(component.activeTab).toBe("pairing");
    });

    it("deviceBrightness should read brightness_pct", () => {
        expect(component.deviceBrightness(lightDevice)).toBe(60);
    });

    it("isToggleDomain should include light and scene", () => {
        expect(component.isToggleDomain("light")).toBeTrue();
        expect(component.isToggleDomain("scene")).toBeTrue();
        expect(component.isToggleDomain("cover")).toBeFalse();
    });

    // The section pages share one tab bar (src/app/shared/styles/_app-tabs.scss,
    // imported by joint-control, system, program-overview and this page). The
    // markup has to match theirs, otherwise the shared styling cannot apply.
    it("uses the standard tab markup of the other section pages", () => {
        const tabList = fixture.nativeElement.querySelector(
            "ul.nav.nav-tabs",
        ) as HTMLElement | null;

        expect(tabList).not.toBeNull();
        const items = Array.from(
            tabList!.querySelectorAll("li.nav-item"),
        ) as HTMLElement[];
        expect(items).toHaveSize(3);
        for (const item of items) {
            const link = item.querySelector(".nav-link.sidebar-btn");
            expect(link).not.toBeNull();
            // A button inside a nav-item is what the active-state class needs.
            expect(link!.tagName).toBe("BUTTON");
        }
    });

    it("marks exactly the selected tab with navbar-btn-active", () => {
        const active = (): string[] =>
            Array.from(
                fixture.nativeElement.querySelectorAll(
                    "li.nav-item.navbar-btn-active .nav-link",
                ) as NodeListOf<HTMLElement>,
            ).map((element) => (element.textContent || "").trim());

        expect(active()).toEqual(["Devices"]);
        component.selectTab("hub");
        fixture.detectChanges();
        expect(active()).toEqual(["Hub & Settings"]);
        component.selectTab("pairing");
        fixture.detectChanges();
        expect(active()).toEqual(["Matter Pairing"]);
    });

    it("keeps the tab test ids the E2E suites use", () => {
        for (const id of [
            "TAB_SmartHome_Devices",
            "TAB_SmartHome_Pairing",
            "TAB_SmartHome_Hub",
        ]) {
            expect(
                fixture.nativeElement.querySelector(`[data-test="${id}"]`),
            ).not.toBeNull();
        }
    });
});
