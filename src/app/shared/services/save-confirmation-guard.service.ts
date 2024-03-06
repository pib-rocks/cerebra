import {Injectable} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SaveConfirmationOptions} from "../types/save-confirmation-options.enum";
import {SaveConfirmationComponent} from "src/app/program/save-confirmation/save-confirmation.component";

@Injectable({
    providedIn: "root",
})
export class SaveConfirmationGuardService {
    constructor(private modalService: NgbModal) {}

    openConfirmationModal(
        title: string,
        message: string,
        confirmationMsg: string,
        denyMsg: string,
    ): Promise<SaveConfirmationOptions> {
        const modalRef = this.modalService.open(SaveConfirmationComponent, {
            windowClass: "myCustomModalClass",
            backdropClass: "myCustomBackdropClass",
            backdrop: "static",
        });
        modalRef.componentInstance.title = title;
        modalRef.componentInstance.message = message;
        modalRef.componentInstance.denyMsg = denyMsg;
        modalRef.componentInstance.confirmationMsg = confirmationMsg;

        return modalRef.result.then(
            (result) => result,
            () => SaveConfirmationOptions.Cancel,
        );
    }
}
