import {Injectable} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SaveConfirmationComponent} from "src/app/program/confirm-leave/save-confirmation.component";
import {SaveConfirmationOptions} from "../types/save-confirmation-options.enum";

@Injectable({
    providedIn: "root",
})
export class SaveConfirmationGuardService {
    constructor(private modalService: NgbModal) {}

    openConfirmationModal(
        title: string,
        message: string,
        confirmationMsg: string,
        cancelMsg: string,
    ): Promise<SaveConfirmationOptions> {
        const modalRef = this.modalService.open(SaveConfirmationComponent, {
            windowClass: "myCustomModalClass",
            backdropClass: "myCustomBackdropClass",
            backdrop: "static",
        });
        modalRef.componentInstance.title = title;
        modalRef.componentInstance.message = message;
        modalRef.componentInstance.cancelMsg = cancelMsg;
        modalRef.componentInstance.confirmationMsg = confirmationMsg;

        return modalRef.result.then(
            (result) => result,
            () => SaveConfirmationOptions.Cancel,
        );
    }
}
