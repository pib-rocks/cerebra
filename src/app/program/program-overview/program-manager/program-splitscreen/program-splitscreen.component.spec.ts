import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ProgramSplitscreenComponent} from "./program-splitscreen.component";
import {AngularSplitModule} from "angular-split";
import {ActivatedRoute, Params} from "@angular/router";
import {ProgramService} from "src/app/shared/services/program.service";
import {BehaviorSubject, Subject} from "rxjs";
import {ProgramWorkspaceComponent} from "./program-workspace/program-workspace.component";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";
import {ProgramLogLine} from "src/app/shared/types/program-log-line";
import {HttpClientModule} from "@angular/common/http";
import {By} from "@angular/platform-browser";

describe("ProgramSplitscreenComponent", () => {
    let component: ProgramSplitscreenComponent;
    let fixture: ComponentFixture<ProgramSplitscreenComponent>;
    let programService: jasmine.SpyObj<ProgramService>;
    let params: BehaviorSubject<Params>;
    let data: BehaviorSubject<Record<string, any>>;

    beforeEach(async () => {
        const programServiceSpy: jasmine.SpyObj<ProgramService> =
            jasmine.createSpyObj("ProgramService", [
                "getProgramFromCache",
                "getAllPrograms",
                "getProgramByProgramNumber",
                "createProgram",
                "updateProgramByProgramNumber",
                "deleteProgramByProgramNumber",
                "getCodeByProgramNumber",
                "updateCodeByProgramNumber",
                "runProgram",
                "terminateProgram",
                "getProgramLogs",
                "getProgramState",
            ]);

        params = new BehaviorSubject<Params>({"program-number": "id-0"});
        data = new BehaviorSubject<Params>({code: "{}"});

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ProgramService,
                    useValue: programServiceSpy,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {params, data},
                },
            ],
            imports: [
                AngularSplitModule,
                HttpClientModule,
                ProgramSplitscreenComponent,
                ProgramWorkspaceComponent,
            ],
        }).compileComponents();
        programService = TestBed.inject(
            ProgramService,
        ) as jasmine.SpyObj<ProgramService>;
        fixture = TestBed.createComponent(ProgramSplitscreenComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should save the code", () => {
        component.codeVisualOld = "visual-old";
        component.codeVisualNew = "visual-new";
        component.codePython = "python";
        component.programNumber = "program-number";
        component.saveCode();
        expect(
            programService.updateCodeByProgramNumber,
        ).toHaveBeenCalledOnceWith("program-number", {
            codeVisual: "visual-new",
        });
        expect(component.codeVisualOld).toEqual("visual-new");
    });

    it("should run the program", () => {
        component.inSplitMode = false;
        component.programNumber = "test-number";
        component.executionState = ExecutionState.NOT_STARTED;
        component.codeVisualOld = "visual-old";
        component.codeVisualNew = "visual-new";
        component.codePython = "python";
        component.runProgram();
        expect(programService.runProgram).toHaveBeenCalledWith("test-number");
        expect(programService.terminateProgram).not.toHaveBeenCalled();
        expect(component.inSplitMode).toBeTrue();
        expect(
            programService.updateCodeByProgramNumber,
        ).toHaveBeenCalledOnceWith("test-number", {
            codeVisual: "visual-new",
        });
        expect(component.codeVisualOld).toEqual("visual-new");
    });

    it("should terminate the program", () => {
        component.inSplitMode = false;
        component.programNumber = "test-number";
        component.executionState = ExecutionState.RUNNING;
        component.runProgram();
        expect(programService.runProgram).not.toHaveBeenCalled();
        expect(programService.terminateProgram).toHaveBeenCalledWith(
            "test-number",
        );
        expect(component.inSplitMode).toBeTrue();
    });

    it("should do nothing", () => {
        component.inSplitMode = false;
        component.programNumber = "test-number";
        component.executionState = ExecutionState.STARTING;
        expect(programService.runProgram).not.toHaveBeenCalled();
        expect(programService.terminateProgram).not.toHaveBeenCalled();
    });

    it("should get visual code from the route", () => {
        const codeVisual = '{"some": "json"}';
        data.next({code: {codeVisual}});
        expect(component.codeVisualNew).toEqual(codeVisual);
        expect(component.codeVisualOld).toEqual(codeVisual);
    });

    it("should get the program-number from the route", () => {
        const programNumber = "test-number";
        component.programNumber = programNumber;

        const programLogs = new Subject<ProgramLogLine[]>();
        const programState = new Subject<ProgramState>();
        programService.getProgramLogs.and.returnValue(programLogs);
        programService.getProgramState.and.returnValue(programState);
        programService.getProgramByProgramNumber.and.returnValue(
            new Subject<any>(),
        );

        params.next({"program-number": programNumber});

        expect(programService.getProgramLogs).toHaveBeenCalledWith(
            programNumber,
        );
        expect(programService.getProgramState).toHaveBeenCalledWith(
            programNumber,
        );

        expect(component.programLogs$).toBe(programLogs);
        expect(component.programState$).toBe(programState);

        component.executionState = ExecutionState.RUNNING;
        programState.next({executionState: ExecutionState.FINISHED_ERROR});
        expect(component.executionState as ExecutionState).toEqual(
            ExecutionState.FINISHED_ERROR,
        );
    });

    describe("toolbar", () => {
        // The Karma bundle does not load Bootstrap, so the utility rules the
        // toolbar markup relies on are copied verbatim from Bootstrap 5.3.
        const BOOTSTRAP_UTILITIES = `
            .position-absolute{position:absolute!important}
            .top-0{top:0!important}
            .end-0{right:0!important}
            .d-flex{display:flex!important}
            .flex-row-reverse{flex-direction:row-reverse!important}
            .hstack{display:flex;flex-direction:row;align-items:center;align-self:stretch}
            .gap-3{gap:1rem!important}
            .pt-4{padding-top:1.5rem!important}
            .pb-4{padding-bottom:1.5rem!important}
            .pe-5{padding-right:3rem!important}
            .pe-none{pointer-events:none!important}
            .h-100{height:100%!important}
            .w-100{width:100%!important}
            .p-3{padding:1rem!important}
            .z-2{z-index:2!important}
        `;
        const TAB_STRIP_HEIGHT = 112;

        let styleElement: HTMLStyleElement;
        let pageWrapper: HTMLDivElement;

        const button = (id: string) =>
            fixture.nativeElement.querySelector(`#${id}`) as HTMLButtonElement;
        const editor = () =>
            fixture.nativeElement.firstElementChild as HTMLElement;
        const toolbar = () => button("export-btn").parentElement as HTMLElement;

        const mountInPage = (width: number) => {
            pageWrapper.style.width = `${width}px`;
            fixture.detectChanges();
        };

        const expectInside = (inner: DOMRect, outer: DOMRect, what: string) => {
            expect(inner.top)
                .withContext(`${what} top`)
                .toBeGreaterThanOrEqual(outer.top - 0.5);
            expect(inner.left)
                .withContext(`${what} left`)
                .toBeGreaterThanOrEqual(outer.left - 0.5);
            expect(inner.right)
                .withContext(`${what} right`)
                .toBeLessThanOrEqual(outer.right + 0.5);
            expect(inner.bottom)
                .withContext(`${what} bottom`)
                .toBeLessThanOrEqual(outer.bottom + 0.5);
        };

        beforeEach(() => {
            styleElement = document.createElement("style");
            styleElement.textContent = BOOTSTRAP_UTILITIES;
            document.head.appendChild(styleElement);

            // Mirrors the app shell: a positioned page wrapper (`.wrapper` in
            // app.component.scss) with the program tabs above the editor.
            pageWrapper = document.createElement("div");
            pageWrapper.style.position = "relative";
            const tabs = document.createElement("div");
            tabs.style.height = `${TAB_STRIP_HEIGHT}px`;
            const editorHost = document.createElement("div");
            editorHost.style.height = "600px";
            pageWrapper.append(tabs, editorHost);
            document.body.appendChild(pageWrapper);

            const host = fixture.nativeElement as HTMLElement;
            host.style.display = "block";
            host.style.height = "100%";
            editorHost.appendChild(host);
        });

        afterEach(() => {
            styleElement.remove();
            pageWrapper.remove();
        });

        it("should be positioned by the editor, not by the page wrapper", () => {
            mountInPage(1200);

            expect(getComputedStyle(editor()).position).toBe("relative");
            expect(toolbar().offsetParent).toBe(editor());
            expect(
                toolbar().getBoundingClientRect().top,
            ).toBeGreaterThanOrEqual(
                pageWrapper.getBoundingClientRect().top + TAB_STRIP_HEIGHT,
            );
        });

        it("should keep every control inside the editor on a wide page", () => {
            mountInPage(1200);
            const editorRect = editor().getBoundingClientRect();

            for (const id of [
                "export-btn",
                "save-btn",
                "run-btn",
                "toggle-btn",
            ]) {
                expectInside(
                    button(id).getBoundingClientRect(),
                    editorRect,
                    id,
                );
            }
        });

        it("should keep every control inside a narrow editor", () => {
            mountInPage(360);
            const editorRect = editor().getBoundingClientRect();

            expect(toolbar().scrollWidth).toBeLessThanOrEqual(
                toolbar().clientWidth,
            );
            for (const id of [
                "export-btn",
                "save-btn",
                "run-btn",
                "toggle-btn",
            ]) {
                expectInside(
                    button(id).getBoundingClientRect(),
                    editorRect,
                    id,
                );
            }
        });

        it("should keep the trashcan flyout offset", () => {
            component.flyoutWidth = 120;
            fixture.detectChanges();

            expect(toolbar().style.transform).toBe("translate(-120px, 0px)");
        });

        it("should export when the export button is clicked", () => {
            const exportSpy = spyOn(component, "exportCode");

            button("export-btn").click();

            expect(exportSpy).toHaveBeenCalledTimes(1);
        });

        it("should save when the enabled save button is clicked", () => {
            component.codeVisualNew = '{"changed": true}';
            fixture.detectChanges();
            const saveSpy = spyOn(component, "saveCode");

            button("save-btn").click();

            expect(saveSpy).toHaveBeenCalledTimes(1);
        });

        it("should run or stop when the run button is clicked", () => {
            const runSpy = spyOn(component, "runProgram");

            button("run-btn").click();

            expect(runSpy).toHaveBeenCalledTimes(1);
        });

        it("should switch between normal and split view", () => {
            expect(component.inSplitMode).toBeFalse();

            button("toggle-btn").click();
            fixture.detectChanges();
            expect(component.inSplitMode).toBeTrue();
            expect(
                fixture.nativeElement.querySelector("#python-code-area"),
            ).not.toBeNull();

            button("toggle-btn").click();
            fixture.detectChanges();
            expect(component.inSplitMode).toBeFalse();
            expect(
                fixture.nativeElement.querySelector("#python-code-area"),
            ).toBeNull();
        });

        it("should keep save disabled until the program is edited", () => {
            const save = button("save-btn");
            const saveSpy = spyOn(component, "saveCode");

            expect(save.disabled).toBeTrue();
            save.click();
            expect(saveSpy).not.toHaveBeenCalled();
            expect(save.querySelector("img")!.getAttribute("src")).toBe(
                component.SAVE_INACTIVE,
            );

            const workspace = fixture.debugElement.query(
                By.directive(ProgramWorkspaceComponent),
            ).componentInstance as ProgramWorkspaceComponent;
            workspace.codeVisualChange.emit('{"edited": true}');
            fixture.detectChanges();

            expect(save.disabled).toBeFalse();
            expect(save.querySelector("img")!.getAttribute("src")).toBe(
                component.SAVE_ACTIVE,
            );
        });
    });
});
