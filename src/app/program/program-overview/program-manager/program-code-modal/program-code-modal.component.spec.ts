import {ComponentFixture, TestBed} from "@angular/core/testing";
import {By} from "@angular/platform-browser";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {HIGHLIGHT_OPTIONS} from "ngx-highlightjs";
import {ProgramCodeModalComponent} from "./program-code-modal.component";
import {PythonCodeComponent} from "../program-splitscreen/python-code/python-code.component";

describe("ProgramCodeModalComponent", () => {
    const CODE = "import time\n\nprint('hello world')\ntime.sleep(1)\n";

    let component: ProgramCodeModalComponent;
    let fixture: ComponentFixture<ProgramCodeModalComponent>;
    let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

    const query = (selector: string) =>
        fixture.nativeElement.querySelector(selector) as HTMLElement | null;
    const copyButton = () =>
        query('[data-test="BTN_Program_Code_Copy"]') as HTMLButtonElement;

    const stubClipboard = (clipboard: Partial<Clipboard> | undefined) =>
        spyOnProperty(navigator, "clipboard", "get").and.returnValue(
            clipboard as Clipboard,
        );

    beforeEach(async () => {
        activeModalSpy = jasmine.createSpyObj("NgbActiveModal", [
            "close",
            "dismiss",
        ]);

        await TestBed.configureTestingModule({
            imports: [ProgramCodeModalComponent],
            providers: [
                {provide: NgbActiveModal, useValue: activeModalSpy},
                {
                    provide: HIGHLIGHT_OPTIONS,
                    useValue: {
                        coreLibraryLoader: () =>
                            import("highlight.js/lib/core"),
                        languages: {
                            python: () =>
                                import("highlight.js/lib/languages/python"),
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgramCodeModalComponent);
        component = fixture.componentInstance;
        component.code = CODE;
        fixture.detectChanges();
    });

    it("should show the code read-only in the python code viewer", () => {
        const viewer = fixture.debugElement.query(
            By.directive(PythonCodeComponent),
        );

        expect(query('[data-test="DLG_Program_Code"]')).not.toBeNull();
        expect((viewer.componentInstance as PythonCodeComponent).code).toBe(
            CODE,
        );
        expect(query("textarea, input, [contenteditable]")).toBeNull();
    });

    it("should offer exactly a copy and a close button", () => {
        const buttons = Array.from(
            fixture.nativeElement.querySelectorAll("button"),
        ) as HTMLButtonElement[];

        expect(buttons.map((b) => b.getAttribute("data-test"))).toEqual([
            "BTN_Program_Code_Copy",
            "BTN_Program_Code_Close",
        ]);
    });

    it("should close the modal on close", () => {
        query('[data-test="BTN_Program_Code_Close"]')!.click();

        expect(activeModalSpy.close).toHaveBeenCalledTimes(1);
        expect(activeModalSpy.dismiss).not.toHaveBeenCalled();
    });

    it("should copy with navigator.clipboard when it is available", async () => {
        const writeText = jasmine.createSpy("writeText").and.resolveTo();
        stubClipboard({writeText});
        const execCommand = spyOn(document, "execCommand");

        await component.copy();
        fixture.detectChanges();

        expect(writeText).toHaveBeenCalledOnceWith(CODE);
        expect(execCommand).not.toHaveBeenCalled();
        expect(query('[data-test="TXT_Program_Code_Copied"]')).not.toBeNull();
    });

    it("should copy through a hidden textarea without navigator.clipboard", async () => {
        stubClipboard(undefined);
        let selected: string | undefined;
        const execCommand = spyOn(document, "execCommand").and.callFake(() => {
            const active = document.activeElement as HTMLTextAreaElement;
            selected = active.value.substring(
                active.selectionStart,
                active.selectionEnd,
            );
            return true;
        });

        await component.copy();
        fixture.detectChanges();

        expect(execCommand).toHaveBeenCalledOnceWith("copy");
        expect(selected).toBe(CODE);
        expect(query("textarea")).toBeNull();
        expect(query('[data-test="TXT_Program_Code_Copied"]')).not.toBeNull();
    });

    it("should fall back to the textarea when navigator.clipboard rejects", async () => {
        const writeText = jasmine
            .createSpy("writeText")
            .and.rejectWith(new DOMException("denied", "NotAllowedError"));
        stubClipboard({writeText});
        const execCommand = spyOn(document, "execCommand").and.returnValue(
            true,
        );

        await component.copy();
        fixture.detectChanges();

        expect(writeText).toHaveBeenCalledOnceWith(CODE);
        expect(execCommand).toHaveBeenCalledOnceWith("copy");
        expect(query('[data-test="TXT_Program_Code_Copied"]')).not.toBeNull();
    });

    it("should report a failed copy", async () => {
        stubClipboard(undefined);
        spyOn(document, "execCommand").and.returnValue(false);

        copyButton().click();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(query('[data-test="TXT_Program_Code_Copied"]')).toBeNull();
        expect(
            query('[data-test="TXT_Program_Code_Copy_Failed"]'),
        ).not.toBeNull();
    });
});
