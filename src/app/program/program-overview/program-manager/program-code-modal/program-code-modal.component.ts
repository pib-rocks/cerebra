import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
} from "@angular/core";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {PythonCodeComponent} from "../program-splitscreen/python-code/python-code.component";

@Component({
    selector: "app-program-code-modal",
    templateUrl: "./program-code-modal.component.html",
    styleUrls: ["./program-code-modal.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PythonCodeComponent],
})
export class ProgramCodeModalComponent {
    @Input() code: string = "";

    copyResult?: "copied" | "failed";

    constructor(
        public activeModal: NgbActiveModal,
        private elementRef: ElementRef<HTMLElement>,
        private cdr: ChangeDetectorRef,
    ) {}

    close() {
        this.activeModal.close();
    }

    async copy() {
        const copied = await this.writeToClipboard(this.code);
        this.copyResult = copied ? "copied" : "failed";
        this.cdr.markForCheck();
    }

    // navigator.clipboard only exists in a secure context (HTTPS or
    // localhost); over plain HTTP on the robot IP it is undefined.
    private async writeToClipboard(text: string): Promise<boolean> {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                // permission denied: try the legacy path below
            }
        }
        return this.copyWithTextarea(text);
    }

    // The textarea is appended inside the modal so the modal's focus trap
    // does not pull focus away before the copy runs.
    private copyWithTextarea(text: string): boolean {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        this.elementRef.nativeElement.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            return document.execCommand("copy");
        } catch {
            return false;
        } finally {
            textarea.remove();
        }
    }
}
