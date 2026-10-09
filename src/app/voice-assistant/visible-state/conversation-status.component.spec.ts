import {ComponentFixture, TestBed} from "@angular/core/testing";
import {BehaviorSubject} from "rxjs";
import {VisibleStateService} from "src/app/shared/services/visible-state.service";
import {
    VisibleConversation,
    visibleConversation,
} from "src/app/shared/types/visible-state";
import {ConversationStatusComponent} from "./conversation-status.component";

describe("ConversationStatusComponent", () => {
    let fixture: ComponentFixture<ConversationStatusComponent>;
    const states = new BehaviorSubject<VisibleConversation>(
        visibleConversation({
            voiceTurnedOn: false,
            listening: false,
            assistantSpeaking: false,
            holderName: null,
            keyStoreDegraded: false,
            liveUnavailable: false,
        }),
    );

    beforeEach(async () => {
        states.next(
            visibleConversation({
                voiceTurnedOn: false,
                listening: false,
                assistantSpeaking: false,
                holderName: null,
                keyStoreDegraded: false,
                liveUnavailable: false,
            }),
        );
        const visible = {
            snapshot: states.value,
            snapshot$: states,
        };
        states.subscribe((state) => {
            visible.snapshot = state;
        });
        await TestBed.configureTestingModule({
            imports: [ConversationStatusComponent],
            providers: [{provide: VisibleStateService, useValue: visible}],
        }).compileComponents();
        fixture = TestBed.createComponent(ConversationStatusComponent);
        fixture.componentInstance.surface = "display";
        fixture.detectChanges();
    });

    it("shows the three states, degraded and fallback in one place", () => {
        const root = () =>
            fixture.nativeElement.querySelector(
                "#display-conversation-state",
            ) as HTMLElement;

        expect(root().textContent).toContain("Nobody holds the voice");
        expect(
            fixture.nativeElement.querySelector("#animated-face"),
        ).not.toBeNull();

        states.next(
            visibleConversation({
                voiceTurnedOn: true,
                listening: true,
                assistantSpeaking: false,
                holderName: "Ada",
                keyStoreDegraded: true,
                liveUnavailable: true,
            }),
        );
        fixture.detectChanges();

        expect(root().textContent).toContain("Ada holds the voice");
        expect(root().textContent).toContain("Listening");
        expect(root().textContent).toContain("Degraded");
        expect(root().textContent).toContain("Fallback");
        expect(
            fixture.nativeElement.querySelector(
                "#display-conversation-activity",
            ).textContent,
        ).toContain("Listening");

        states.next(
            visibleConversation({
                voiceTurnedOn: true,
                listening: false,
                assistantSpeaking: false,
                holderName: "Ada",
                keyStoreDegraded: false,
                liveUnavailable: false,
            }),
        );
        fixture.detectChanges();
        expect(root().textContent).toContain("Thinking");
        expect(
            fixture.nativeElement
                .querySelector("#animated-face")
                .getAttribute("data-activity"),
        ).toBe("thinking");

        states.next(
            visibleConversation({
                voiceTurnedOn: true,
                listening: false,
                assistantSpeaking: true,
                holderName: "Ada",
                keyStoreDegraded: false,
                liveUnavailable: false,
            }),
        );
        fixture.detectChanges();
        expect(root().textContent).toContain("Speaking");
        expect(
            fixture.nativeElement
                .querySelector("#animated-face")
                .classList.contains("mouth-open"),
        ).toBeTrue();
    });

    it("shows the full holder line in the voice assistant without the face", () => {
        fixture.componentInstance.surface = "assistant";
        fixture.detectChanges();

        const root = fixture.nativeElement.querySelector(
            "#assistant-conversation-state",
        ) as HTMLElement;
        expect(root).not.toBeNull();
        expect(root.classList.contains("assistant")).toBeTrue();
        expect(root.textContent).toContain("Nobody holds the voice");
        expect(
            fixture.nativeElement.querySelector("#assistant-voice-holder")
                .textContent,
        ).toContain("Nobody holds the voice");
        expect(
            fixture.nativeElement.querySelector("#animated-face"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#display-conversation-state"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#voice-channel-holder"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#header-conversation-state"),
        ).toBeNull();

        states.next(
            visibleConversation({
                voiceTurnedOn: true,
                listening: true,
                assistantSpeaking: false,
                holderName: "Ada",
                keyStoreDegraded: true,
                liveUnavailable: true,
            }),
        );
        fixture.detectChanges();

        expect(root.textContent).toContain("Ada holds the voice");
        expect(root.textContent).toContain("Listening");
        expect(root.textContent).toContain("Degraded");
        expect(root.textContent).toContain("Fallback");
        expect(
            fixture.nativeElement.querySelector(
                "#assistant-conversation-activity",
            ).textContent,
        ).toContain("Listening");
        expect(
            fixture.nativeElement.querySelector(
                "#assistant-conversation-degraded",
            ),
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector(
                "#assistant-conversation-fallback",
            ),
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector(
                "#display-conversation-activity",
            ),
        ).toBeNull();
    });
});
