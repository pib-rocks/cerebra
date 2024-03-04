import {Injectable} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfirmLeaveComponent} from "src/app/program/confirm-leave/confirm-leave.component";

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
    ): Promise<boolean> {
        const modalRef = this.modalService.open(ConfirmLeaveComponent, {
            windowClass: "myCustomModalClass",
            backdropClass: "myCustomBackdropClass",
            backdrop: "static",
        });
        modalRef.componentInstance.title = title;
        modalRef.componentInstance.message = message;
        modalRef.componentInstance.cancelMsg = cancelMsg;
        modalRef.componentInstance.confirmationMsg = confirmationMsg;

        return modalRef.result.then(
            (result) => result === true,
            () => false, // Modal dismissed without confirmation
        );
    }
}
