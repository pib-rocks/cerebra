import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Observable, from, map} from "rxjs";
import {PoseService} from "src/app/shared/services/pose.service";
import {Pose} from "src/app/shared/types/pose";

@Component({
    selector: "app-pose",
    templateUrl: "./pose.component.html",
    styleUrls: ["./pose.component.css"],
})
export class PoseComponent implements OnInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;

    poses!: Observable<Pose[]>;

    modalTitle = "";

    nameFormControl: FormControl<string> = new FormControl();

    selectedPoseId?: string;

    constructor(
        private poseService: PoseService,
        private modalService: NgbModal,
    ) {}

    ngOnInit(): void {
        this.poses = this.poseService.getPosesObservable();
    }

    savePose() {
        this.getNameInput("Add new pose", "New Pose").subscribe((name) => {
            this.poseService.saveCurrentPose(name).subscribe((pose) => {
                this.selectPose(pose);
            });
        });
    }

    renamePose(pose: Pose) {
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
                return this.nameFormControl.value;
            }),
        );
    }
}
