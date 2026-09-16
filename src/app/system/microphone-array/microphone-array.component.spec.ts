import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    discardPeriodicTasks,
} from "@angular/core/testing";
import {MicrophoneArrayComponent} from "./microphone-array.component";
import {
    MicrophoneArrayService,
    MicrophoneArrayTelemetry,
    MicrophoneArrayTuning,
} from "./microphone-array.service";
import {of, throwError} from "rxjs";
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";

describe("MicrophoneArrayComponent", () => {
    let component: MicrophoneArrayComponent;
    let fixture: ComponentFixture<MicrophoneArrayComponent>;
    let serviceSpy: jasmine.SpyObj<MicrophoneArrayService>;

    const mockTelemetry: MicrophoneArrayTelemetry = {
        doa_angle: 135,
        voice_activity: true,
        speech_detected: false,
        audio_levels: [0.8, 0.4, 0.2, 0.1, 0.05],
    };

    const mockTuning: MicrophoneArrayTuning = {
        preset: "standard",
        agc_enabled: true,
        agc_max_gain: 30,
        agc_target_level: 0.005,
        stationary_noise_suppression: true,
        non_stationary_noise_suppression: true,
        aec_enabled: true,
        high_pass_filter: 1,
        led_mode: "doa_trace",
        led_brightness: 50,
        led_color: "#e83e8c",
    };

    beforeEach(async () => {
        serviceSpy = jasmine.createSpyObj("MicrophoneArrayService", [
            "getTelemetry",
            "getTuning",
            "updateTuning",
        ]);

        serviceSpy.getTelemetry.and.returnValue(of(mockTelemetry));
        serviceSpy.getTuning.and.returnValue(of(mockTuning));
        serviceSpy.updateTuning.and.callFake((update) =>
            of({...mockTuning, ...update}),
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
        expect(serviceSpy.getTuning).toHaveBeenCalled();
        expect(component.telemetry.doa_angle).toBe(135);
        expect(component.tuning.preset).toBe("standard");
    });

    it("should render DOA compass with angle readout and status badges", () => {
        const compiled = fixture.nativeElement as HTMLElement;

        expect(
            compiled.querySelector("[data-test='VIS_DOA_Compass']"),
        ).toBeTruthy();
        expect(
            compiled.querySelector("[data-test='TXT_DOA_Angle']")?.textContent,
        ).toContain("135°");
        expect(
            compiled.querySelector("[data-test='BADGE_VAD']")?.textContent,
        ).toContain("Active");
        expect(
            compiled.querySelector("[data-test='BADGE_Speech']")?.textContent,
        ).toContain("None");
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
        ).toContain("80%");
    });

    it("should apply preset via updateTuning", () => {
        component.onPresetChange("noisy_asr");
        expect(serviceSpy.updateTuning).toHaveBeenCalledWith({
            preset: "noisy_asr",
        });
        expect(component.tuning.preset).toBe("noisy_asr");
    });

    it("should mark preset custom and post DSP tuning updates", () => {
        component.tuning.agc_max_gain = 45;
        component.onDspChange();

        expect(serviceSpy.updateTuning).toHaveBeenCalled();
        const payload = serviceSpy.updateTuning.calls.mostRecent().args[0];
        expect(payload.agc_max_gain).toBe(45);
        expect(payload.preset).toBe("custom");
    });

    it("should update LED ring controls", () => {
        component.tuning.led_mode = "solid";
        component.tuning.led_brightness = 80;
        component.tuning.led_color = "#00ff00";
        component.onLedChange();

        expect(serviceSpy.updateTuning).toHaveBeenCalledWith({
            led_mode: "solid",
            led_brightness: 80,
            led_color: "#00ff00",
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
        expect(component.tuning.agc_target_level).toBeCloseTo(0.01, 5);
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
        expect(ledSelect.options.length).toBe(5);
        expect(presetSelect.textContent).toContain("Noisy Environment / ASR");
        expect(hpfSelect.textContent).toContain("150Hz");
        expect(ledSelect.textContent).toContain("DOA Trace");
    });
});
