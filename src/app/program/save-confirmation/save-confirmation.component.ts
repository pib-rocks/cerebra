import {Component, Input} from "@angular/core";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SaveConfirmationOptions} from "../../shared/types/save-confirmation-options.enum";

@Component({
    selector: "app-confirm-leave",
    templateUrl: "./save-confirmation.component.html",
    styleUrls: ["./save-confirmation.component.css"],
})
export class SaveConfirmationComponent {
    @Input() title: string = "Warning";
    @Input() message: string = "You have unsaved changes.";

    @Input() confirmationMsg: string = "Save";
    @Input() denyMsg: string = "Don't Save";

    constructor(public activeModal: NgbActiveModal) {}

    confirm() {
        this.activeModal.close(SaveConfirmationOptions.Save);
    }

    deny() {
        this.activeModal.close(SaveConfirmationOptions.Deny);
    }

    cancel() {
        this.activeModal.dismiss(SaveConfirmationOptions.Cancel);
    }
}
