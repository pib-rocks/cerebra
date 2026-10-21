import {ComponentFixture, TestBed} from "@angular/core/testing";
import {VoiceStatusStripComponent} from "./voice-status-strip.component";
import {
    EMPTY_VOICE_STATUS,
    VoiceStatus,
} from "src/app/shared/types/voice-status";
import {ProviderHealth} from "src/app/shared/types/provider-health";

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

    // PC-115: the provider of the open personality is named before the first
    // turn, with the health colour the backend reported.
    function setProvider(
        provider: ProviderHealth | null,
        label = "",
        loading = false,
    ) {
        fixture.componentRef.setInput("provider", provider);
        fixture.componentRef.setInput("providerLabel", label);
        fixture.componentRef.setInput("providerLoading", loading);
        fixture.detectChanges();
    }

    function providerChip(): HTMLElement | null {
        return fixture.nativeElement.querySelector(
            '[data-test="VOICE_STATUS_PROVIDER"]',
        );
    }

    it("hides the provider chip while no provider is known", () => {
        expect(providerChip()).toBeNull();
    });

    it("shows the provider label before any probe has answered", () => {
        setProvider(null, "pib.Cloud");

        expect(providerChip()).not.toBeNull();
        expect(text("VOICE_STATUS_PROVIDER")).toContain("pib.Cloud");
        expect(text("VOICE_STATUS_PROVIDER")).toContain("not checked");
        expect(
            providerChip()!.classList.contains("provider-health-neutral"),
        ).toBeTrue();
    });

    it("paints a reachable provider green", () => {
        setProvider({state: "healthy", model: "pib.Cloud"}, "pib.Cloud");

        expect(
            providerChip()!.classList.contains("provider-health-healthy"),
        ).toBeTrue();
        expect(text("VOICE_STATUS_PROVIDER")).toContain("pib.Cloud");
        expect(text("VOICE_STATUS_PROVIDER")).toContain("reachable");
    });

    it("paints an unusable provider red with the reason in the tooltip", () => {
        setProvider(
            {state: "unreachable", reason: "budget_exhausted"},
            "pib.Cloud",
        );

        expect(
            providerChip()!.classList.contains("provider-health-unreachable"),
        ).toBeTrue();
        expect(text("VOICE_STATUS_PROVIDER")).toContain("unreachable");
        expect(providerChip()!.getAttribute("title")).toContain(
            "budget exhausted",
        );
    });

    it("shows checking while a probe is in flight", () => {
        setProvider(null, "pib.Cloud", true);

        expect(text("VOICE_STATUS_PROVIDER")).toContain("checking");
    });

    it("emits a refresh request once per click", () => {
        setProvider({state: "healthy"}, "pib.Cloud");
        const emitted: number[] = [];
        fixture.componentInstance.providerRefresh.subscribe(() =>
            emitted.push(1),
        );

        fixture.nativeElement
            .querySelector('[data-test="BTN_PROVIDER_HEALTH_REFRESH"]')
            .click();

        expect(emitted.length).toBe(1);
    });

    it("does not emit while a probe is already running", () => {
        setProvider(null, "pib.Cloud", true);
        const emitted: number[] = [];
        fixture.componentInstance.providerRefresh.subscribe(() =>
            emitted.push(1),
        );

        fixture.componentInstance.requestProviderRefresh();

        expect(emitted.length).toBe(0);
    });
});
