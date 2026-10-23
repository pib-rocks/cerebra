import {ComponentFixture, TestBed} from "@angular/core/testing";

import {MotorSettingsComponent} from "./motor-settings.component";
import {HorizontalSliderComponent} from "src/app/sliders/horizontal-slider/horizontal-slider.component";
import {VerticalSliderComponent} from "src/app/sliders/vertical-slider/vertical-slider.component";
import {MotorService} from "src/app/shared/services/motor.service";
import {ReactiveFormsModule} from "@angular/forms";
import {BehaviorSubject, of, Subject} from "rxjs";
import {MotorSettings} from "src/app/shared/types/motor-settings.class";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {EmbeddedViewRef, TemplateRef, ViewContainerRef} from "@angular/core";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";
import {VariantService} from "src/app/shared/services/variant.service";

describe("MotorSettingsComponent", () => {
    let component: MotorSettingsComponent;
    let fixture: ComponentFixture<MotorSettingsComponent>;

    let motorService: jasmine.SpyObj<MotorService>;
    let settingsSubject: Subject<MotorSettings>;
    let settings: MotorSettings;
    let motor: MotorConfiguration;

    let modalService: jasmine.SpyObj<NgbModal>;
    let actualPositionAvailable: BehaviorSubject<boolean>;
    let temperatureAvailable: BehaviorSubject<boolean>;
    let installedKinds: BehaviorSubject<string[]>;
    let endpointMappingAvailable: BehaviorSubject<boolean>;
    let variantServiceSpy: jasmine.SpyObj<VariantService>;

    function createMotor(
        overrides: Partial<MotorConfiguration> = {},
    ): MotorConfiguration {
        return {
            motorName: "test_motor",
            motorPathName: "test-motor",
            label: "Test Motor",
            sliderIconLeft: "/path-to-icon",
            sliderIconRight: "/path-to-icon",
            captionLeft: "left",
            captionRight: "right",
            touchPointCenterX: 0.2,
            touchPointCenterY: 0.3,
            isMultiMotor: true,
            sourceMotorName: "test_motor",
            ...overrides,
        };
    }

    function configureVariantService(): void {
        variantServiceSpy = jasmine.createSpyObj("VariantService", [
            "hasFeedback",
            "hasMeaningfulSetting",
            "getInstalledControllerKinds",
        ]);
        actualPositionAvailable = new BehaviorSubject(false);
        temperatureAvailable = new BehaviorSubject(false);
        installedKinds = new BehaviorSubject<string[]>([]);
        endpointMappingAvailable = new BehaviorSubject(true);
        variantServiceSpy.hasFeedback.and.callFake((feedback: string) =>
            feedback === "actual_position"
                ? actualPositionAvailable
                : temperatureAvailable,
        );
        variantServiceSpy.getInstalledControllerKinds.and.returnValue(
            installedKinds,
        );
        variantServiceSpy.hasMeaningfulSetting.and.callFake(
            (setting: string) => {
                if (setting === "endpoint_mapping") {
                    return endpointMappingAvailable;
                }
                return new BehaviorSubject(true);
            },
        );
    }

    async function setupComponent(
        motorConfig: MotorConfiguration = motor,
    ): Promise<void> {
        const motorServiceSpy: jasmine.SpyObj<MotorService> =
            jasmine.createSpyObj("MotorService", [
                "getSettingsObservable",
                "applySettings",
                "calibrateZero",
                "getFeedbackObservable",
            ]);
        settingsSubject = new Subject();
        motorServiceSpy.getSettingsObservable.and.returnValue(settingsSubject);
        motorServiceSpy.getFeedbackObservable.and.returnValue(of("42.5"));

        const modalServiceSpy: jasmine.SpyObj<NgbModal> = jasmine.createSpyObj(
            "NgbModal",
            ["open"],
        );
        configureVariantService();

        settings = {
            velocity: 0,
            acceleration: 100,
            deceleration: 200,
            period: 300,
            pulseWidthMin: 400,
            pulseWidthMax: 500,
            rotationRangeMin: 600,
            rotationRangeMax: 700,
            turnedOn: true,
            visible: false,
            upperEndpoint: "max",
        };

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: MotorService,
                    useValue: motorServiceSpy,
                },
                {
                    provide: NgbModal,
                    useValue: modalServiceSpy,
                },
                {
                    provide: VariantService,
                    useValue: variantServiceSpy,
                },
            ],
            imports: [
                ReactiveFormsModule,
                MotorSettingsComponent,
                HorizontalSliderComponent,
                VerticalSliderComponent,
            ],
        }).compileComponents();

        motorService = TestBed.inject(
            MotorService,
        ) as jasmine.SpyObj<MotorService>;
        modalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;

        fixture = TestBed.createComponent(MotorSettingsComponent);
        component = fixture.componentInstance;
        component.motor = motorConfig;
        fixture.detectChanges();
    }

    beforeEach(async () => {
        motor = createMotor();
        await setupComponent();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("gates advanced feedback in motor settings from capabilities", () => {
        expect(component.showActualPosition).toBeFalse();
        expect(component.showTemperature).toBeFalse();

        actualPositionAvailable.next(true);
        temperatureAvailable.next(true);

        expect(component.showActualPosition).toBeTrue();
        expect(component.showTemperature).toBeTrue();
    });

    it("should get its settings from the motor-service", () => {
        const pulseWidthSpy = spyOn(component.pulseWidthSubject$, "next");
        const degreeSpy = spyOn(component.degreeSubject$, "next");
        const periodSpy = spyOn(component.periodSubject$, "next");
        const decelerationSpy = spyOn(component.decelerationSubject$, "next");
        const accelerationSpy = spyOn(component.accelerationSubject$, "next");
        const velocitySpy = spyOn(component.velocitySubject$, "next");
        const turnedOnSpy = spyOn(component.turnedOnFormControl, "setValue");
        const upperEndpointSpy = spyOn(
            component.upperEndpointFormControl,
            "setValue",
        );

        settingsSubject.next(settings);

        expect(pulseWidthSpy).toHaveBeenCalledOnceWith([400, 500]);
        expect(degreeSpy).toHaveBeenCalledOnceWith([6, 7]);
        expect(periodSpy).toHaveBeenCalledOnceWith([300]);
        expect(decelerationSpy).toHaveBeenCalledOnceWith(200);
        expect(accelerationSpy).toHaveBeenCalledOnceWith(100);
        expect(velocitySpy).toHaveBeenCalledOnceWith(0);
        expect(turnedOnSpy).toHaveBeenCalledOnceWith(true);
        expect(upperEndpointSpy).toHaveBeenCalledOnceWith("max", {
            emitEvent: false,
        });

        const expectedSettings = structuredClone(settings);
        expect(component.settings).toEqual(expectedSettings);
    });

    it("initialises upperEndpoint from legacy invert when upperEndpoint is absent", () => {
        const legacySettings = {
            ...settings,
            upperEndpoint: undefined as unknown as "max",
            invert: true,
        };
        settingsSubject.next(legacySettings as MotorSettings);
        expect(component.upperEndpointFormControl.value).toBe("min");
    });

    it("should set the pulse-width", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.pulseWidthMin = 1000;
        settingsNew.pulseWidthMax = 1100;
        component.setPulseRanges([1000, 1100]);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the degree", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.rotationRangeMin = 1000;
        settingsNew.rotationRangeMax = 1100;
        component.setDegree([10, 11]);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the period", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.period = 1000;
        component.setPeriod(1000);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the deceleration", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.deceleration = 1000;
        component.setDeceleration(1000);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the acceleration", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.acceleration = 1000;
        component.setAcceleration(1000);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the velocity", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.velocity = 1000;
        component.setVelocity(1000);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should change turned-on", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.turnedOn = false;
        component.turnedOnFormControl.setValue(true);
        component.setTurnedOn();
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should open a popup", () => {
        const content: TemplateRef<any> = {} as TemplateRef<any>;
        component.openPopup(content);
        expect(modalService.open).toHaveBeenCalledOnceWith(content, {
            ariaLabelledBy: "modal-basic-title",
            size: "xl",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
        });
    });

    it("gates motor settings controls from meaningful settings capabilities", () => {
        const meaningfulSettingAvailability = new Map<
            string,
            BehaviorSubject<boolean>
        >();
        meaningfulSettingAvailability.set(
            "pulse_width",
            new BehaviorSubject(false),
        );
        meaningfulSettingAvailability.set("period", new BehaviorSubject(false));
        meaningfulSettingAvailability.set(
            "deceleration",
            new BehaviorSubject(false),
        );
        meaningfulSettingAvailability.set(
            "zero_calibration",
            new BehaviorSubject(true),
        );
        meaningfulSettingAvailability.set(
            "endpoint_mapping",
            new BehaviorSubject(false),
        );
        variantServiceSpy.hasMeaningfulSetting.and.callFake(
            (setting: string) =>
                meaningfulSettingAvailability.get(setting) ??
                new BehaviorSubject(false),
        );

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                {provide: MotorService, useValue: motorService},
                {provide: NgbModal, useValue: modalService},
                {provide: VariantService, useValue: variantServiceSpy},
            ],
            imports: [
                ReactiveFormsModule,
                MotorSettingsComponent,
                HorizontalSliderComponent,
                VerticalSliderComponent,
            ],
        }).compileComponents();

        const localFixture = TestBed.createComponent(MotorSettingsComponent);
        const localComponent = localFixture.componentInstance;
        localComponent.motor = motor;
        localFixture.detectChanges();

        expect(localComponent.showPulseWidth).toBeFalse();
        expect(localComponent.showPeriod).toBeFalse();
        expect(localComponent.showDeceleration).toBeFalse();
        expect(localComponent.showZeroCalibration).toBeTrue();
        expect(localComponent.showEndpointMapping).toBeFalse();
    });

    it("setCurrentPositionAsZero calls motorService.calibrateZero", () => {
        component.setCurrentPositionAsZero();
        expect(motorService.calibrateZero).toHaveBeenCalledOnceWith(
            "test_motor",
        );
    });

    describe("endpoint mapping rows", () => {
        let modalHost: ViewContainerRef;

        let modalView: EmbeddedViewRef<unknown>;

        function renderModalContent(): void {
            component.displayExtended = true;
            component.showEndpointMapping = true;
            component.settings = structuredClone(settings);
            modalHost.clear();
            modalView = modalHost.createEmbeddedView(component.content);
            fixture.detectChanges();
        }

        function modalText(): string {
            return modalView.rootNodes
                .map((node) => node.textContent ?? "")
                .join("");
        }

        function modalQuery(selector: string): Element | null {
            for (const node of modalView.rootNodes) {
                if (!(node instanceof HTMLElement)) {
                    continue;
                }
                const match =
                    node.querySelector(selector) ??
                    (node.matches(selector) ? node : null);
                if (match) {
                    return match;
                }
            }
            return null;
        }

        beforeEach(() => {
            modalHost = fixture.debugElement.injector.get(ViewContainerRef);
            settingsSubject.next(settings);
        });

        it("renders group labels for head, elbow, and stretch motors", () => {
            component.motor = createMotor({motorName: "turn_head_motor"});
            renderModalContent();
            expect(modalText()).toContain("Oben");
            expect(modalText()).toContain("Unten");

            component.motor = createMotor({motorName: "elbow_right"});
            renderModalContent();
            expect(modalText()).toContain("Beugen");
            expect(modalText()).toContain("Strecken");

            component.motor = createMotor({motorName: "thumb_right_stretch"});
            renderModalContent();
            expect(modalText()).toContain("Offen");
            expect(modalText()).toContain("Geschlossen");
        });

        it("persists upperEndpoint when the first-row dropdown changes", () => {
            renderModalContent();

            const select = modalQuery(
                '[data-test="SEL_Motor_Settings_First_Endpoint"]',
            ) as HTMLSelectElement;
            expect(select).toBeTruthy();
            expect(component.endpointValues).toEqual([600, 700]);

            component.setUpperEndpoint("min");
            expect(motorService.applySettings).toHaveBeenCalledWith(
                "test_motor",
                jasmine.objectContaining({upperEndpoint: "min"}),
            );
        });

        it("shows the complementary bound on the second row", () => {
            component.settings = structuredClone(settings);
            component.settings.upperEndpoint = "max";
            renderModalContent();

            const second = modalQuery(
                '[data-test="TXT_Motor_Settings_Second_Endpoint"]',
            );
            expect(second?.textContent).toContain("600");

            component.setUpperEndpoint("min");
            fixture.detectChanges();
            expect(
                modalQuery('[data-test="TXT_Motor_Settings_Second_Endpoint"]')
                    ?.textContent,
            ).toContain("700");
        });

        it("shows Current pos buttons only for feetech_st_serial", () => {
            installedKinds.next(["tinkerforge_bricklet"]);
            renderModalContent();
            expect(
                modalQuery(
                    '[data-test="BTN_Motor_Settings_First_Endpoint_Current_Pos"]',
                ),
            ).toBeFalsy();

            installedKinds.next(["feetech_st_serial"]);
            renderModalContent();
            expect(
                modalQuery(
                    '[data-test="BTN_Motor_Settings_First_Endpoint_Current_Pos"]',
                ),
            ).toBeTruthy();
            expect(
                modalQuery(
                    '[data-test="BTN_Motor_Settings_Second_Endpoint_Current_Pos"]',
                ),
            ).toBeTruthy();
        });

        it("teaches the current position into the selected endpoint and updates the degree slider", () => {
            const degreeSpy = spyOn(component.degreeSubject$, "next");
            component.settings = structuredClone(settings);
            component.settings.upperEndpoint = "max";
            component.actualPosition = 4250;
            installedKinds.next(["feetech_st_serial"]);
            renderModalContent();

            component.setFirstEndpointToCurrentPosition();
            expect(component.settings.rotationRangeMax).toBe(4250);
            expect(motorService.applySettings).toHaveBeenCalled();
            expect(degreeSpy).toHaveBeenCalledWith([6, 42]);

            component.setSecondEndpointToCurrentPosition();
            expect(component.settings.rotationRangeMin).toBe(4250);
            expect(degreeSpy).toHaveBeenCalledWith([42, 42]);
        });
    });
});
