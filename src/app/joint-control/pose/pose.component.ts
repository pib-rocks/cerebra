import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {PoseService} from "src/app/shared/services/pose.service";
import {Pose} from "src/app/shared/types/pose";

@Component({
    selector: "app-pose",
    templateUrl: "./pose.component.html",
    styleUrls: ["./pose.component.css"],
})
export class PoseComponent implements OnInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;

    poses: Pose[] = [];

    nameFormControl: FormControl<string> = new FormControl();

    selectedPoseId?: string;

    constructor(
        private route: ActivatedRoute,
        private poseService: PoseService,
        private modalService: NgbModal,
    ) {}

    ngOnInit(): void {
        this.route.data.subscribe((data) => {
            this.poses = data["poses"];
            console.info(this.poses);
        });
        this.poseService.getAllPoses().subscribe((poses) => {
            console.log(poses);
            this.poses = poses;
        });
    }

    showModal(): Promise<string> {
        return this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            windowClass: "myCustomModalClass",
            backdropClass: "myCustomBackdropClass",
        }).result;
    }

    savePose() {
        this.nameFormControl.setValue("");
        this.showModal().then(() => {
            if (this.nameFormControl.valid) {
                this.poseService
                    .saveCurrentPose(this.nameFormControl.value)
                    .subscribe((pose) => (this.selectedPoseId = pose.poseId));
            }
        });
    }
}
