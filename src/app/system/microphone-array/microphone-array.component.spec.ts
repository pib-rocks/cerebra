import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    discardPeriodicTasks,
} from "@angular/core/testing";
import {MicrophoneArrayComponent} from "./microphone-array.component";
import {
    adaptMicrophoneArrayDocument,
    MicrophoneArrayHealthDocument,
    MicrophoneArrayService,
    MicrophoneArrayTelemetryDocument,
    MicrophoneArrayTelemetryViewModel,
    MicrophoneArrayTuningDocument,
} from "./microphone-array.service";
import {of, Subject, throwError} from "rxjs";
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";

describe("MicrophoneArrayComponent", () => {
    let component: MicrophoneArrayComponent;
    let fixture: ComponentFixture<MicrophoneArrayComponent>;
    let serviceSpy: jasmine.SpyObj<MicrophoneArrayService>;

    // Copies of documents returned by microphone_array_service.py.
    const telemetryDocument: MicrophoneArrayTelemetryDocument = {
        doa_angle: 180,
        voice_activity: false,
        speech_detected: false,
        audio_levels: [0.05, 0.02, 0.02, 0.03, 0.02],
        simulation: true,
        simulation_reason: "test reset",
    };

    const tuningDocument: MicrophoneArrayTuningDocument = {
        preset: "Standard",
        presets: [
            "Standard",
            "Noisy Environment / ASR",
            "Loud Speaker Playback",
            "Raw",
            "Custom",
        ],
        parameters: {
            AGCONOFF: 1,
            AGCMAXGAIN: 31.6,
            AGCDESIREDLEVEL: 0.005,
            AGCTIME: 1,
            STATNOISEONOFF: 1,
            NONSTATNOISEONOFF: 1,
            ECHOONOFF: 1,
            HPFONOFF: 1,
            STATNOISEONOFF_SR: 1,
            NONSTATNOISEONOFF_SR: 1,
        },
        led_ring: {
            mode: "off",
            brightness: 16,
            color: "#000000",
            vad_led: 0,
        },
        simulation: true,
        simulation_reason: "test reset",
    };

    const healthDocument: MicrophoneArrayHealthDocument = {
        simulation: true,
        simulation_reason: "test reset",
        device_access: false,
        owner: "ros-audio-io",
        vendor_id: "0x2886",
        product_id: "0x0018",
        note: "Live values come from the ros-audio-io owner.",
    };

    beforeEach(async () => {
        serviceSpy = jasmine.createSpyObj("MicrophoneArrayService", [
            "getTelemetry",
            "getHealth",
            "getTuning",
            "updateTuning",
        ]);

        serviceSpy.getTelemetry.and.returnValue(
            of(adaptMicrophoneArrayDocument(telemetryDocument)),
        );
        serviceSpy.getHealth.and.returnValue(
            of(adaptMicrophoneArrayDocument(healthDocument)),
        );
        serviceSpy.getTuning.and.returnValue(
            of(adaptMicrophoneArrayDocument(tuningDocument)),
        );
        serviceSpy.updateTuning.and.callFake((update) =>
            of({
                ...adaptMicrophoneArrayDocument(tuningDocument),
                preset: update.preset ?? "Custom",
            }),
        );

        await TestBed.configureTestingModule({
            imports: [MicrophoneArrayComponent],
            providers: [
                {provide: MicrophoneArrayService, useValue: serviceSpy},
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MicrophoneArrayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it("should create component and load telemetry/tuning on init", () => {
        expect(component).toBeTruthy();
        expect(serviceSpy.getTelemetry).toHaveBeenCalled();
        expect(serviceSpy.getHealth).toHaveBeenCalled();
        expect(serviceSpy.getTuning).toHaveBeenCalled();
        expect(component.telemetry?.doaAngle).toBe(180);
        expect(component.health?.owner).toBe("ros-audio-io");
        expect(component.tuning?.preset).toBe("Standard");
    });

    it("should prominently identify simulated values, their reason, and owner", () => {
        const banner = fixture.nativeElement.querySelector(
            "[data-test='MSG_Microphone_Array_Simulation']",
        ) as HTMLElement;

        expect(banner).toBeTruthy();
        expect(banner.textContent).toContain(
            "simulated, not live measurements",
        );
        expect(banner.textContent).toContain("test reset");
        expect(banner.textContent).toContain("ros-audio-io");
    });

    it("should not render the simulation banner for real values", () => {
        serviceSpy.getTelemetry.and.returnValue(
            of(
                adaptMicrophoneArrayDocument({
                    ...telemetryDocument,
                    simulation: false,
                    simulation_reason: null,
                }),
            ),
        );
        serviceSpy.getTuning.and.returnValue(
            of(
                adaptMicrophoneArrayDocument({
                    ...tuningDocument,
                    simulation: false,
                    simulation_reason: null,
                }),
            ),
        );
        serviceSpy.getHealth.and.returnValue(
            of(
                adaptMicrophoneArrayDocument({
                    ...healthDocument,
                    simulation: false,
                    simulation_reason: null,
                }),
            ),
        );
        const realFixture = TestBed.createComponent(MicrophoneArrayComponent);
        realFixture.detectChanges();

        expect(
            realFixture.nativeElement.querySelector(
                "[data-test='MSG_Microphone_Array_Simulation']",
            ),
        ).toBeNull();
        realFixture.destroy();
    });

    it("should render every field from the health document", () => {
        const compiled = fixture.nativeElement as HTMLElement;

        expect(
            compiled.querySelector(
                "[data-test='TXT_Microphone_Array_Device_Access']",
            )?.textContent,
        ).toContain("No");
        expect(
            compiled.querySelector("[data-test='TXT_Microphone_Array_Owner']")
                ?.textContent,
        ).toContain("ros-audio-io");
        expect(
            compiled.querySelector(
                "[data-test='TXT_Microphone_Array_Vendor_Id']",
            )?.textContent,
        ).toContain("0x2886");
        expect(
            compiled.querySelector(
                "[data-test='TXT_Microphone_Array_Product_Id']",
            )?.textContent,
        ).toContain("0x0018");
        expect(
            compiled.querySelector(
                "[data-test='TXT_Microphone_Array_Health_Note']",
            )?.textContent,
        ).toContain("Live values come from the ros-audio-io owner.");
    });

    it("should render an explicit failed health state", () => {
        serviceSpy.getHealth.and.returnValue(
            throwError(() => new Error("network")),
        );
        const errorFixture = TestBed.createComponent(MicrophoneArrayComponent);
        errorFixture.detectChanges();

        expect(
            errorFixture.nativeElement.querySelector(
                "[data-test='MSG_Microphone_Array_Health_Error']",
            ).textContent,
        ).toContain("Failed to load microphone array health information.");
        errorFixture.destroy();
    });

    it("should show a loading state before the first telemetry answer", () => {
        serviceSpy.getTelemetry.and.returnValue(
            new Subject<MicrophoneArrayTelemetryViewModel>(),
        );
        const loadingFixture = TestBed.createComponent(
            MicrophoneArrayComponent,
        );
        loadingFixture.detectChanges();

        expect(
            loadingFixture.nativeElement.querySelector(
                "[data-test='TXT_Microphone_Array_Telemetry_Loading']",
            ),
        ).toBeTruthy();
        expect(
            loadingFixture.nativeElement.querySelector(
                "[data-test='VIS_DOA_Compass']",
            ),
        ).toBeNull();
        loadingFixture.destroy();
    });

    it("should render a telemetry document error as an error", () => {
        serviceSpy.getTelemetry.and.returnValue(
            of(
                adaptMicrophoneArrayDocument({
                    ...telemetryDocument,
                    simulation: false,
                    simulation_reason: null,
                    error: "USB telemetry read failed",
                }),
            ),
        );
        const errorFixture = TestBed.createComponent(MicrophoneArrayComponent);
        errorFixture.detectChanges();
        const error = errorFixture.nativeElement.querySelector(
            "[data-test='MSG_Microphone_Array_Telemetry_Error']",
        ) as HTMLElement;

        expect(error).toBeTruthy();
        expect(error.classList).toContain("alert-danger");
        expect(error.textContent).toContain("USB telemetry read failed");
        errorFixture.destroy();
    });

    it("should render DOA compass with angle readout and status badges", () => {
        const compiled = fixture.nativeElement as HTMLElement;

        expect(
            compiled.querySelector("[data-test='VIS_DOA_Compass']"),
        ).toBeTruthy();
        expect(
            compiled.querySelector("[data-test='TXT_DOA_Angle']")?.textContent,
        ).toContain("180°");
        expect(
            compiled.querySelector("[data-test='BADGE_VAD']")?.textContent,
        ).toContain("Idle");
        expect(
            compiled.querySelector("[data-test='BADGE_Speech']")?.textContent,
        ).toContain("None");
        expect(
            compiled.querySelector("[data-test='BADGE_Telemetry_Mode']")
                ?.textContent,
        ).toContain("Simulation");
        expect(
            compiled.querySelector("[data-test='TXT_Tuning_Mode']")
                ?.textContent,
        ).toContain("Simulation");
    });

    it("should render 5-channel audio level meters", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const bars = compiled.querySelectorAll(
            "[data-test^='BAR_Audio_Level_']",
        );
        expect(bars.length).toBe(5);
        expect(
            compiled.querySelector("[data-test='TXT_Audio_Level_0']")
                ?.textContent,
        ).toContain("5%");
    });

    it("should apply preset via updateTuning", () => {
        component.onPresetChange("Noisy Environment / ASR");
        expect(serviceSpy.updateTuning).toHaveBeenCalledWith({
            preset: "Noisy Environment / ASR",
        });
        expect(component.tuning?.preset).toBe("Noisy Environment / ASR");
    });

    it("should post every reported DSP value in the documented parameters object", () => {
        if (!component.tuning) {
            fail("Expected tuning to load");
            return;
        }
        component.tuning.agcMaxGain = 45;
        component.onDspChange();

        expect(serviceSpy.updateTuning).toHaveBeenCalledWith({
            parameters: {
                HPFONOFF: 1,
                AGCONOFF: 1,
                AGCMAXGAIN: 45,
                AGCDESIREDLEVEL: 0.005,
                AGCTIME: 1,
                STATNOISEONOFF: 1,
                NONSTATNOISEONOFF: 1,
                ECHOONOFF: 1,
                STATNOISEONOFF_SR: 1,
                NONSTATNOISEONOFF_SR: 1,
            },
        });
    });

    it("should update LED ring controls with the documented payload", () => {
        if (!component.tuning) {
            fail("Expected tuning to load");
            return;
        }
        component.tuning.ledMode = "mono";
        component.tuning.ledBrightness = 31;
        component.tuning.ledColor = "#00ff00";
        component.tuning.vadLed = true;
        component.onLedChange();

        expect(serviceSpy.updateTuning).toHaveBeenCalledWith({
            led_ring: {
                mode: "mono",
                brightness: 31,
                color: "#00ff00",
                vad_led: 1,
            },
        });
    });

    it("should poll telemetry periodically", fakeAsync(() => {
        const pollFixture = TestBed.createComponent(MicrophoneArrayComponent);
        pollFixture.detectChanges();
        serviceSpy.getTelemetry.calls.reset();

        tick(500);
        expect(serviceSpy.getTelemetry).toHaveBeenCalled();
        tick(500);
        expect(serviceSpy.getTelemetry.calls.count()).toBeGreaterThanOrEqual(2);

        pollFixture.destroy();
        discardPeriodicTasks();
    }));

    it("should convert target level between linear and dBov", () => {
        component.setTargetLevelDbov(-20);
        expect(component.tuning?.agcDesiredLevel).toBeCloseTo(0.01, 5);
        expect(component.getTargetLevelDbov()).toBeCloseTo(-20, 0);
    });

    it("should surface tuning load errors", () => {
        serviceSpy.getTuning.and.returnValue(
            throwError(() => new Error("network")),
        );
        const errorFixture = TestBed.createComponent(MicrophoneArrayComponent);
        errorFixture.detectChanges();
        expect(errorFixture.componentInstance.error).toContain(
            "Failed to load microphone array tuning.",
        );
        errorFixture.destroy();
    });

    it("should map every documented parameter to its control", () => {
        const compiled = fixture.nativeElement as HTMLElement;

        expect(
            (
                compiled.querySelector(
                    "[data-test='CHK_AGC_Enabled']",
                ) as HTMLInputElement
            ).checked,
        ).toBeTrue();
        expect(
            (
                compiled.querySelector(
                    "[data-test='SLD_AGC_Max_Gain']",
                ) as HTMLInputElement
            ).value,
        ).toBe("31.6");
        expect(
            Number(
                (
                    compiled.querySelector(
                        "[data-test='SLD_AGC_Target_Level']",
                    ) as HTMLInputElement
                ).value,
            ),
        ).toBeCloseTo(-23, 0);
        expect(
            (
                compiled.querySelector(
                    "[data-test='SLD_AGC_Time']",
                ) as HTMLInputElement
            ).value,
        ).toBe("1");
        expect(
            (
                compiled.querySelector(
                    "[data-test='CHK_Stationary_Noise']",
                ) as HTMLInputElement
            ).checked,
        ).toBeTrue();
        expect(
            (
                compiled.querySelector(
                    "[data-test='CHK_Non_Stationary_Noise']",
                ) as HTMLInputElement
            ).checked,
        ).toBeTrue();
        expect(
            (
                compiled.querySelector(
                    "[data-test='CHK_AEC_Enabled']",
                ) as HTMLInputElement
            ).checked,
        ).toBeTrue();
        expect(
            (
                compiled.querySelector(
                    "[data-test='CHK_Stationary_Noise_SR']",
                ) as HTMLInputElement
            ).checked,
        ).toBeTrue();
        expect(
            (
                compiled.querySelector(
                    "[data-test='CHK_Non_Stationary_Noise_SR']",
                ) as HTMLInputElement
            ).checked,
        ).toBeTrue();
        expect(
            (
                compiled.querySelector(
                    "[data-test='SEL_High_Pass_Filter']",
                ) as HTMLSelectElement
            ).selectedOptions[0].textContent,
        ).toContain("70Hz");
    });

    it("should render preset, HPF and LED mode dropdown options", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const presetSelect = compiled.querySelector(
            "[data-test='SEL_Microphone_Array_Preset']",
        ) as HTMLSelectElement;
        const hpfSelect = compiled.querySelector(
            "[data-test='SEL_High_Pass_Filter']",
        ) as HTMLSelectElement;
        const ledSelect = compiled.querySelector(
            "[data-test='SEL_LED_Mode']",
        ) as HTMLSelectElement;

        expect(presetSelect.options.length).toBe(5);
        expect(hpfSelect.options.length).toBe(4);
        expect(ledSelect.options.length).toBe(7);
        expect(presetSelect.textContent).toContain("Noisy Environment / ASR");
        expect(hpfSelect.textContent).toContain("150Hz");
        expect(ledSelect.textContent).toContain("DOA Trace");
        expect(component.tuning?.presets).toEqual(tuningDocument.presets);
    });

    it("should not synthesize audio channels", () => {
        serviceSpy.getTelemetry.and.returnValue(
            of(
                adaptMicrophoneArrayDocument({
                    ...telemetryDocument,
                    audio_levels: [0.4, 0.2],
                }),
            ),
        );
        const shortFixture = TestBed.createComponent(MicrophoneArrayComponent);
        shortFixture.detectChanges();

        expect(
            shortFixture.nativeElement.querySelectorAll(
                "[data-test^='BAR_Audio_Level_']",
            ).length,
        ).toBe(2);
        shortFixture.destroy();
    });

    it("should render not reported when a parameter is absent", () => {
        const missingParameterDocument: MicrophoneArrayTuningDocument = {
            ...tuningDocument,
            parameters: {
                ...tuningDocument.parameters,
                AGCTIME: undefined,
            },
        };
        serviceSpy.getTuning.and.returnValue(
            of(adaptMicrophoneArrayDocument(missingParameterDocument)),
        );
        const missingFixture = TestBed.createComponent(
            MicrophoneArrayComponent,
        );
        missingFixture.detectChanges();
        missingFixture.detectChanges();

        expect(
            missingFixture.nativeElement.querySelector(
                "[data-test='TXT_AGC_Time_Value']",
            ).textContent,
        ).toContain("not reported");
        missingFixture.destroy();
    });
});
