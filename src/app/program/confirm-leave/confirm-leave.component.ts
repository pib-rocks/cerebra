import {Component, Input} from "@angular/core";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: "app-confirm-leave",
    templateUrl: "./confirm-leave.component.html",
    styleUrls: ["./confirm-leave.component.css"],
})
export class ConfirmLeaveComponent {
    @Input() title: string = "Warning";
    @Input() message: string =
        "You have unsaved changes. Are you sure you want to leave?";

    @Input() confirmationMsg: string = "Confirm";
    @Input() cancelMsg: string = "Cancel";

    constructor(public activeModal: NgbActiveModal) {}

    confirm() {
        this.activeModal.close(true);
    }

    cancel() {
        this.activeModal.dismiss(false);
    }
}
