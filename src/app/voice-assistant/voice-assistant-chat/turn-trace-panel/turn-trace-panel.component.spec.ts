import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
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
            toolCalls: [],
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

    it("omits the tools section when there are no tool calls", () => {
        setTrace({
            ...emptyTurnTrace("chat-1"),
            startedMs: 0,
            stages: {end_of_speech: 0},
            source: "pib-cloud",
        });
        expect(all("TURN_TRACE_TOOLS").length).toBe(0);
    });

    it("renders one row per tool call with name, status, and duration", () => {
        setTrace({
            chatId: "chat-1",
            startedMs: 1000,
            stages: {end_of_speech: 0},
            source: "pib-cloud",
            model: "",
            streamEnd: "",
            toolCalls: [
                {
                    callId: "list_motors-0",
                    name: "list_motors",
                    argNames: ["limit"],
                    status: "ok",
                    startedMs: 100,
                    durationMs: 1111,
                    error: "",
                },
                {
                    callId: "ping-0",
                    name: "ping",
                    argNames: [],
                    status: "error",
                    startedMs: 200,
                    durationMs: 50,
                    error: "refused",
                },
            ],
        });

        expect(all("TURN_TRACE_TOOL_ROW").length).toBe(2);
        expect(text("TURN_TRACE_TOOL_NAME")).toBe("list_motors");
        const statuses = all("TURN_TRACE_TOOL_STATUS").map((el) =>
            el.textContent!.trim(),
        );
        expect(statuses).toEqual(["ok", "error"]);
        expect(text("TURN_TRACE_TOOL_STARTED")).toContain("+100 ms");
        const elapsed = all("TURN_TRACE_TOOL_ELAPSED").map((el) =>
            el.textContent!.trim(),
        );
        expect(elapsed).toEqual(["1111 ms", "50 ms"]);
        expect(text("TURN_TRACE_TOOL_ERROR")).toBe("refused");
    });

    it("grows elapsed time on a running tool between timer ticks", fakeAsync(() => {
        setTrace({
            chatId: "chat-1",
            startedMs: 1000,
            stages: {end_of_speech: 0},
            source: "pib-cloud",
            model: "",
            streamEnd: "",
            toolCalls: [
                {
                    callId: "list_motors-0",
                    name: "list_motors",
                    argNames: [],
                    status: "running",
                    startedMs: 0,
                    durationMs: null,
                    error: "",
                },
            ],
        });

        const elapsedEl: HTMLElement = fixture.nativeElement.querySelector(
            '[data-test="TURN_TRACE_TOOL_ELAPSED"]',
        );
        const first = Number.parseFloat(elapsedEl.textContent!);
        tick(500);
        fixture.detectChanges();
        const second = Number.parseFloat(elapsedEl.textContent!);
        expect(second).toBeGreaterThan(first);
    }));

    it("clears the live timer on destroy", fakeAsync(() => {
        setTrace({
            chatId: "chat-1",
            startedMs: 1000,
            stages: {end_of_speech: 0},
            source: "pib-cloud",
            model: "",
            streamEnd: "",
            toolCalls: [
                {
                    callId: "list_motors-0",
                    name: "list_motors",
                    argNames: [],
                    status: "running",
                    startedMs: 0,
                    durationMs: null,
                    error: "",
                },
            ],
        });

        const component = fixture.componentInstance;
        expect(component["liveTimer"]).not.toBeNull();
        const markSpy = spyOn(component["cdr"], "markForCheck");

        fixture.destroy();
        expect(component["liveTimer"]).toBeNull();
        tick(500);
        expect(markSpy).not.toHaveBeenCalled();
    }));
});
