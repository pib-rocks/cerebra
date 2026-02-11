import {
    Component,
    ElementRef,
    OnInit,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewChildren,
} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Observable, from, map} from "rxjs";
import {PoseService} from "src/app/shared/services/pose.service";
import {Pose} from "src/app/shared/types/pose";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
    selector: "app-pose",
    templateUrl: "./pose.component.html",
    styleUrls: ["./pose.component.css"],
})
export class PoseComponent implements OnInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    @ViewChildren("renameButton") renameButtons:
        | QueryList<ElementRef<HTMLButtonElement>>
        | undefined;

    poses!: Observable<Pose[]>;

    modalTitle = "";

    nameFormControl: FormControl<string | null> = new FormControl("", {
        validators: [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(255),
        ],
    });

    selectedPoseId?: string;

    constructor(
        private poseService: PoseService,
        private modalService: NgbModal,
        private matSnackBarService: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.poses = this.poseService.getPosesObservable();
    }

    savePose() {
        this.getNameInput("Add new pose", "New pose").subscribe((name) => {
            this.poseService.saveCurrentPose(name).subscribe((pose) => {
                this.selectPose(pose);
            });
        });
    }

    renamePose(pose: Pose) {
        if (!pose.deletable) {
            return;
        }
        this.selectPose(pose);
        this.getNameInput("Rename pose", pose.name).subscribe((name) => {
            this.poseService.renamePose(pose.poseId, name);
        });
    }

    deletePose(pose: Pose) {
        this.poseService.deletePose(pose.poseId);
    }

    applyPose(pose: Pose) {
        this.selectPose(pose);
        this.poseService.applyPose(pose.poseId);
    }

    selectPose(pose: Pose) {
        this.selectedPoseId = pose.poseId;
    }

    updatePoseMotorPositions(pose: Pose) {
        if (!pose.deletable && pose.name !== "Calibration") {
            return;
        }
        this.selectPose(pose);
        this.poseService.updatePoseMotorPositions(pose.poseId).subscribe(() => {
            this.matSnackBarService.open("Pose updated successfully", "", {
                panelClass: "cerebra-toast",
                duration: 3000,
            });
        });
    }

    private getNameInput(
        modalTitle: string,
        defaultValue: string,
    ): Observable<string> {
        this.modalTitle = modalTitle;
        this.nameFormControl.setValue(defaultValue);
        const observable = from(
            this.modalService.open(this.modalContent, {
                ariaLabelledBy: "rename-pose",
                size: "sm",
                windowClass: "cerebra-modal",
                backdropClass: "cerebra-modal-backdrop",
            }).result,
        );
        return observable.pipe(
            map(() => {
                if (!this.nameFormControl.valid) {
                    throw new Error("invalid name");
                }
                return this.nameFormControl.value!;
            }),
        );
    }
}
