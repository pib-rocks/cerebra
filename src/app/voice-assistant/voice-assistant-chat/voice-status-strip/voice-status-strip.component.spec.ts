import {ComponentFixture, TestBed} from "@angular/core/testing";
import {VoiceStatusStripComponent} from "./voice-status-strip.component";
import {
    EMPTY_VOICE_STATUS,
    VoiceStatus,
} from "src/app/shared/types/voice-status";

describe("VoiceStatusStripComponent", () => {
    let fixture: ComponentFixture<VoiceStatusStripComponent>;

    function setStatus(status: VoiceStatus) {
        fixture.componentRef.setInput("status", status);
        fixture.detectChanges();
    }

    function text(testId: string): string | null {
        const element: HTMLElement | null = fixture.nativeElement.querySelector(
            `[data-test="${testId}"]`,
        );
        return element ? element.textContent!.trim() : null;
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VoiceStatusStripComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(VoiceStatusStripComponent);
        fixture.detectChanges();
    });

    it("shows the idle strip without inventing a source", () => {
        expect(
            fixture.nativeElement.querySelector(
                '[data-test="VOICE_STATUS_STRIP"]',
            ),
        ).not.toBeNull();
        expect(text("VOICE_STATUS_MIC")).toBe("Voice off");
        expect(text("VOICE_STATUS_PHASE")).toBe("Idle");
        expect(
            fixture.nativeElement.querySelector(
                '[data-test="VOICE_STATUS_SOURCE"]',
            ),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector(
                '[data-test="VOICE_STATUS_STAGE"]',
            ),
        ).toBeNull();
    });

    it("shows listening, the transport and the last stage with its elapsed time", () => {
        setStatus({
            mic: "listening",
            phase: "speaking",
            source: "pib.Cloud",
            model: "pib-cloud",
            lastStage: "first audio",
            lastStageElapsedMs: 1141,
        });

        expect(text("VOICE_STATUS_MIC")).toBe("Listening");
        expect(text("VOICE_STATUS_PHASE")).toBe("Speaking");
        expect(text("VOICE_STATUS_SOURCE")).toContain("pib.Cloud");
        expect(text("VOICE_STATUS_SOURCE")).toContain("pib-cloud");
        expect(text("VOICE_STATUS_STAGE")).toBe("first audio +1141 ms");
    });

    it("marks the microphone chip active only while listening", () => {
        setStatus({...EMPTY_VOICE_STATUS, mic: "ready"});
        let chip: HTMLElement = fixture.nativeElement.querySelector(
            '[data-test="VOICE_STATUS_MIC"]',
        );
        expect(chip.classList.contains("voice-status-chip-active")).toBe(false);
        expect(chip.classList.contains("voice-status-chip-muted")).toBe(false);

        setStatus({...EMPTY_VOICE_STATUS, mic: "listening"});
        chip = fixture.nativeElement.querySelector(
            '[data-test="VOICE_STATUS_MIC"]',
        );
        expect(chip.classList.contains("voice-status-chip-active")).toBe(true);
    });

    it("shows a stage without elapsed time when the turn start is unknown", () => {
        setStatus({
            mic: "ready",
            phase: "thinking",
            source: "",
            model: "",
            lastStage: "end of speech",
            lastStageElapsedMs: null,
        });

        expect(text("VOICE_STATUS_PHASE")).toBe("Thinking");
        expect(text("VOICE_STATUS_STAGE")).toBe("end of speech");
    });
});
