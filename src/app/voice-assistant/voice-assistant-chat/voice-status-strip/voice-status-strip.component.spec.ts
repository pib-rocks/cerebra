import {ComponentFixture, TestBed} from "@angular/core/testing";
import {BehaviorSubject} from "rxjs";
import {VoiceStatusStripComponent} from "./voice-status-strip.component";
import {
    EMPTY_VOICE_STATUS,
    VoiceStatus,
} from "src/app/shared/types/voice-status";
import {ProviderHealth} from "src/app/shared/types/provider-health";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";

describe("VoiceStatusStripComponent", () => {
    let fixture: ComponentFixture<VoiceStatusStripComponent>;
    let healthSubject: BehaviorSubject<unknown>;

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
        healthSubject = new BehaviorSubject<unknown>(null);
        await TestBed.configureTestingModule({
            imports: [VoiceStatusStripComponent],
            providers: [
                {
                    provide: VoiceAssistantService,
                    useValue: {voiceAssistantHealth: () => healthSubject},
                },
            ],
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

    function emitVoiceAssistantStatus(status: unknown) {
        healthSubject.next(status);
        fixture.detectChanges();
    }

    function voiceAssistantChipElement(): HTMLElement | null {
        return fixture.nativeElement.querySelector(
            '[data-test="DEEP_CHAT_VOICE_ASSISTANT_CHIP"]',
        );
    }

    it("renders the voice container verdict inside the same row", () => {
        emitVoiceAssistantStatus({state: "ok"});

        const strip = fixture.nativeElement.querySelector(
            '[data-test="VOICE_STATUS_STRIP"]',
        ) as HTMLElement;
        const chip = voiceAssistantChipElement();

        expect(chip).not.toBeNull();
        // Same row means same parent as the microphone chip: no extra line.
        expect(chip!.parentElement).toBe(strip);
        expect(chip!.textContent).toContain("Voice assistant · ok");
        expect(chip!.classList.contains("voice-status-chip-ok")).toBe(true);
    });

    it("marks a failing node or key as attention and keeps the reason as tooltip", () => {
        emitVoiceAssistantStatus({
            state: "attention",
            reason: "No keys are available for provider gemini.",
        });

        const chip = voiceAssistantChipElement()!;
        expect(chip.textContent).toContain("Voice assistant · attention");
        expect(chip.classList.contains("voice-status-chip-attention")).toBe(
            true,
        );
        expect(chip.getAttribute("title")).toContain(
            "No keys are available for provider gemini.",
        );
    });

    it("keeps an unmeasured verdict neutral, not red", () => {
        emitVoiceAssistantStatus({state: "unknown"});

        const chip = voiceAssistantChipElement()!;
        expect(chip.classList.contains("voice-status-chip-neutral")).toBe(true);
        expect(chip.classList.contains("voice-status-chip-attention")).toBe(
            false,
        );
        expect(chip.classList.contains("voice-status-chip-ok")).toBe(false);
    });

    it("still shows a chip before the verdict arrives, in the neutral tone", () => {
        // The initial read is async; the chip is present and neutral until it lands.
        const chip = voiceAssistantChipElement()!;
        expect(chip.classList.contains("voice-status-chip-neutral")).toBe(true);
    });

    it("shows the personality's warm state in the same row as the other chips", () => {
        fixture.componentRef.setInput("warmth", {state: "warm", warm: true});
        fixture.detectChanges();

        const chip: HTMLElement = fixture.nativeElement.querySelector(
            '[data-test="VOICE_STATUS_WARMTH"]',
        );
        expect(chip).not.toBeNull();
        expect(chip.textContent!.trim()).toBe("Personality: warm");
        expect(chip.classList.contains("voice-status-chip-warm")).toBeTrue();
        expect(chip.closest(".voice-status")).toBe(
            fixture.nativeElement.querySelector(".voice-status"),
        );
    });

    it("shows a cold personality as cold, not as a fault", () => {
        fixture.componentRef.setInput("warmth", {
            state: "cold",
            warm: false,
            reason: "no_provider_key",
        });
        fixture.detectChanges();

        const chip: HTMLElement = fixture.nativeElement.querySelector(
            '[data-test="VOICE_STATUS_WARMTH"]',
        );
        expect(chip.textContent!.trim()).toBe("Personality: cold");
        expect(chip.classList.contains("voice-status-chip-cold")).toBeTrue();
        expect(chip.getAttribute("title")).toContain("no provider key stored");
    });

    it("shows a warm-up in flight and a direct personality neutrally", () => {
        fixture.componentRef.setInput("warmth", {
            state: "warming",
            warm: false,
        });
        fixture.detectChanges();
        expect(text("VOICE_STATUS_WARMTH")).toBe("Personality: warming…");

        fixture.componentRef.setInput("warmth", {
            state: "notSupported",
            warm: false,
        });
        fixture.detectChanges();
        expect(text("VOICE_STATUS_WARMTH")).toBe(
            "Personality: direct · no warm-up",
        );
    });

    it("shows no warmth chip while no personality is open", () => {
        expect(
            fixture.nativeElement.querySelector(
                '[data-test="VOICE_STATUS_WARMTH"]',
            ),
        ).toBeNull();
    });
});
