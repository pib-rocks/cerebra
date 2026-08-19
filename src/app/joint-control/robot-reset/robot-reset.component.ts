import {Component, TemplateRef, ViewChild} from "@angular/core";
import {MatSnackBar} from "@angular/material/snack-bar";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {finalize} from "rxjs";
import {PoseService} from "../../shared/services/pose.service";

const RESET_POSE_NAMES = ["start1", "start2", "start3"];
const RESET_SETTLE_MILLISECONDS = 10_000;

@Component({
    selector: "app-robot-reset",
    templateUrl: "./robot-reset.component.html",
    styleUrls: ["./robot-reset.component.scss"],
})
export class RobotResetComponent {
    @ViewChild("resetProgressModal", {static: true})
    resetProgressModal!: TemplateRef<unknown>;

    isResetting = false;
    private modalRef?: NgbModalRef;

    constructor(
        private poseService: PoseService,
        private modalService: NgbModal,
        private snackBar: MatSnackBar,
    ) {}

    resetPosition(): void {
        if (this.isResetting) return;

        this.isResetting = true;
        this.modalRef = this.modalService.open(this.resetProgressModal, {
            backdrop: "static",
            backdropClass: "reset-modal-backdrop",
            beforeDismiss: () => false,
            centered: true,
            keyboard: false,
            windowClass: "cerebra-modal reset-progress-modal",
        });
        void this.modalRef.result.catch(() => undefined);

        this.poseService
            .applyPoseSequence(RESET_POSE_NAMES, RESET_SETTLE_MILLISECONDS)
            .pipe(finalize(() => (this.isResetting = false)))
            .subscribe({
                complete: () => this.closeProgressModal(),
                error: (error) => {
                    console.error("Position reset failed", error);
                    this.closeProgressModal();
                    this.snackBar.open(
                        "Position reset failed. Please check the motor connection.",
                        "",
                        {
                            panelClass: "cerebra-toast",
                            duration: 5000,
                        },
                    );
                },
            });
    }

    private closeProgressModal(): void {
        this.modalRef?.close();
        this.modalRef = undefined;
    }
}
