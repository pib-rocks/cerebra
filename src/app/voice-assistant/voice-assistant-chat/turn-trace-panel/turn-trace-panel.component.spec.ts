import {ComponentFixture, TestBed} from "@angular/core/testing";
import {TurnTracePanelComponent} from "./turn-trace-panel.component";
import {emptyTurnTrace, type TurnTrace} from "src/app/shared/types/turn-trace";

describe("TurnTracePanelComponent", () => {
    let fixture: ComponentFixture<TurnTracePanelComponent>;

    function setTrace(trace: TurnTrace) {
        fixture.componentRef.setInput("trace", trace);
        fixture.detectChanges();
    }

    function text(testId: string): string {
        const element: HTMLElement | null = fixture.nativeElement.querySelector(
            `[data-test="${testId}"]`,
        );
        return element ? element.textContent!.replace(/\s+/g, " ").trim() : "";
    }

    function all(testId: string): HTMLElement[] {
        return Array.from(
            fixture.nativeElement.querySelectorAll(`[data-test="${testId}"]`),
        );
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TurnTracePanelComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(TurnTracePanelComponent);
        fixture.detectChanges();
    });

    it("shows an empty state before the first turn", () => {
        expect(text("TURN_TRACE_SUMMARY")).toBe("turn trace: no turn yet");
        expect(text("TURN_TRACE_EMPTY")).toContain("No turn has been recorded");
        expect(all("TURN_TRACE_ROW").length).toBe(0);
    });

    it("lists the stages with their time since the turn start", () => {
        setTrace({
            chatId: "chat-1",
            startedMs: 1000,
            stages: {
                end_of_speech: 0,
                text_received: 500,
                request_sent: 584.4,
                first_token: 832.1,
            },
            source: "pib-cloud",
            model: "pib-cloud",
            streamEnd: "done",
        });

        expect(text("TURN_TRACE_SUMMARY")).toBe(
            "turn trace: pib-cloud · 3/8 stages",
        );
        const rows = all("TURN_TRACE_ROW").map((row) =>
            Array.from(row.querySelectorAll("td"))
                .map((cell) => cell.textContent!.trim())
                .join(" "),
        );
        expect(rows).toEqual([
            "end of speech +0 ms",
            "request sent +584.4 ms",
            "first token +832.1 ms",
            "text received +500 ms",
        ]);
        // eos_to_text and text_to_req have both ends; that is 2 of the 8 deltas.
        expect(all("TURN_TRACE_DELTA").length).toBe(2);
        expect(text("TURN_TRACE_SUMMARY")).toBe(
            "turn trace: pib-cloud · 3/8 stages",
        );
    });

    it("keeps the panel collapsed until it is opened", () => {
        setTrace(emptyTurnTrace("chat-1"));
        const details: HTMLDetailsElement = fixture.nativeElement.querySelector(
            '[data-test="TURN_TRACE_PANEL"]',
        );
        expect(details.open).toBe(false);
    });
});
