import {
    Component,
    ElementRef,
    OnInit,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewChildren,
    ChangeDetectionStrategy,
} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Observable, from, map} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {PoseService} from "src/app/shared/services/pose.service";
import {PoseTransferService} from "src/app/shared/services/pose-transfer.service";
import {Pose} from "src/app/shared/types/pose";
import {
    PoseImportValidationResult,
    PoseTransfer,
} from "src/app/shared/types/pose-transfer";

@Component({
    selector: "app-pose",
    templateUrl: "./pose.component.html",
    styleUrls: ["./pose.component.css"],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class PoseComponent implements OnInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    @ViewChild("poseImportInput")
    poseImportInput: ElementRef<HTMLInputElement> | undefined;
    @ViewChildren("renameButton") renameButtons:
        | QueryList<ElementRef<HTMLButtonElement>>
        | undefined;

    poses!: Observable<Pose[]>;
    modalTitle = "";
    importPreview?: PoseTransfer;
    importErrors: string[] = [];
    importWarnings: string[] = [];

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
        private poseTransferService: PoseTransferService,
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
        if (!pose.deletable && pose.name !== "Startup/Resting") {
            return;
        }
        this.selectPose(pose);
        this.poseService.updatePoseMotorPositions(pose.poseId).subscribe(() => {
            this.showToast("Pose updated successfully");
        });
    }

    openPoseImportFileDialog(): void {
        this.poseImportInput?.nativeElement.click();
    }

    onPoseImportFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        this.importPreview = undefined;
        this.importErrors = [];
        this.importWarnings = [];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            const result = this.poseTransferService.parsePoseFileContent(
                String(reader.result ?? ""),
            );

            this.applyImportValidationResult(result);
            input.value = "";
        };

        reader.onerror = () => {
            this.importErrors = ["Datei konnte nicht gelesen werden."];
            input.value = "";
        };

        reader.readAsText(file);
    }

    confirmPoseImport(): void {
        if (!this.importPreview) return;

        this.poseService.importPose(this.importPreview).subscribe({
            next: (pose) => {
                this.selectPose(pose);
                this.importPreview = undefined;
                this.importErrors = [];
                this.importWarnings = [];
                this.showToast("Pose imported successfully");
            },
            error: () => {
                this.importErrors = ["Pose konnte nicht gespeichert werden."];
            },
        });
    }

    cancelPoseImport(): void {
        this.importPreview = undefined;
        this.importErrors = [];
        this.importWarnings = [];
    }

    exportPose(pose: Pose): void {
        this.selectPose(pose);

        this.poseService.exportPose(pose.poseId).subscribe({
            next: (poseTransfer) => {
                this.poseTransferService.downloadPose(poseTransfer);
                this.showToast("Pose exported successfully");
            },
            error: () => {
                this.showToast("Pose export failed");
            },
        });
    }

    private applyImportValidationResult(
        result: PoseImportValidationResult,
    ): void {
        this.importErrors = result.errors;
        this.importWarnings = result.warnings;
        this.importPreview = result.valid ? result.pose : undefined;
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

    private showToast(message: string): void {
        this.matSnackBarService.open(message, "", {
            panelClass: "cerebra-toast",
            duration: 3000,
        });
    }
}
