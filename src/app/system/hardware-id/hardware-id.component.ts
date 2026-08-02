import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ElementRef,
    ViewChild,
} from "@angular/core";
import {
    FormControl,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from "@angular/forms";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {Bricklet} from "src/app/shared/types/bricklet";
import {
    patternOrOptionalValidator,
    uniqueValuesValidator,
} from "src/app/shared/validators/bricklet-uid.validator";
import {
    DiagnosticsService,
    HardwareConfig,
} from "../diagnostics/diagnostics.service";

@Component({
    selector: "app-hardware-id",
    templateUrl: "./hardware-id.component.html",
    styleUrl: "./hardware-id.component.scss",
    changeDetection: ChangeDetectionStrategy.Default,
    imports: [ReactiveFormsModule],
})
export class HardwareIdComponent implements OnInit {
    @ViewChild("hardwareImportInput")
    hardwareImportInput?: ElementRef<HTMLInputElement>;

    servoBricklets: Bricklet[] = [];
    relayBricklets: Bricklet[] = [];
    rgbBricklets: Bricklet[] = [];
    brickletUidForm = new FormGroup({}, {validators: uniqueValuesValidator()});

    exportingHardwareIds = false;
    importingHardwareIds = false;
    showImportModal = false;
    importPreview: HardwareConfig | null = null;
    importErrors: string[] = [];
    importWarnings: string[] = [];
    importSuccessMessage: string | null = null;
    error: string | null = null;

    constructor(
        private brickletService: BrickletService,
        private diagnosticsService: DiagnosticsService,
    ) {}

    ngOnInit(): void {
        this.brickletService.getBrickletObservable().subscribe((bricklets) => {
            this.servoBricklets = bricklets.filter(
                (b) => b.type == "Servo Bricklet",
            );
            this.relayBricklets = bricklets.filter(
                (b) => b.type === "Solid State Relay Bricklet",
            );
            this.rgbBricklets = bricklets.filter(
                (b) => b.type === "RGB LED Button Bricklet",
            );

            bricklets.forEach((bricklet) => {
                this.brickletUidForm.addControl(
                    bricklet.brickletNumber.toString(),
                    new FormControl(bricklet.uid, [
                        Validators.maxLength(6),
                        patternOrOptionalValidator(),
                    ]),
                );
            });
        });
    }

    updateIds() {
        if (!this.brickletUidForm.valid) return;
        const newBrickletInput: Record<number, string> =
            this.brickletUidForm.getRawValue();
        const changedBricklets: Bricklet[] =
            this.detectChangedBricklets(newBrickletInput);

        if (changedBricklets.length > 0) {
            this.brickletService.renameBrickletUid(changedBricklets);
        }
    }

    exportHardwareIds(): void {
        this.exportingHardwareIds = true;
        this.error = null;
        this.importSuccessMessage = null;

        this.diagnosticsService.exportHardwareConfig().subscribe({
            next: (config) => {
                this.diagnosticsService.downloadHardwareConfig(config);
                this.exportingHardwareIds = false;
                this.importSuccessMessage = "Hardware-IDs exported successfully.";
            },
            error: () => {
                this.exportingHardwareIds = false;
                this.error = "Failed to export Hardware-IDs.";
            },
        });
    }

    openImportModal(): void {
        this.resetImportState();
        this.showImportModal = true;
    }

    closeImportModal(): void {
        this.showImportModal = false;
        this.resetImportState();
    }

    openHardwareImportFileDialog(): void {
        this.hardwareImportInput?.nativeElement.click();
    }

    onHardwareImportFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = "";

        this.importPreview = null;
        this.importErrors = [];
        this.importWarnings = [];
        this.importSuccessMessage = null;

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const content = typeof reader.result === "string" ? reader.result : "";
            const result =
                this.diagnosticsService.parseHardwareConfigFileContent(content);
            this.importErrors = result.errors;
            this.importWarnings = result.warnings;
            this.importPreview = result.valid ? result.config ?? null : null;
        };
        reader.onerror = () => {
            this.importErrors = ["The selected file could not be read."];
            this.importPreview = null;
        };
        reader.readAsText(file);
    }

    confirmHardwareImport(): void {
        if (!this.importPreview || this.importingHardwareIds) {
            return;
        }

        this.importingHardwareIds = true;
        this.error = null;

        this.diagnosticsService.importHardwareConfig(this.importPreview).subscribe({
            next: () => {
                this.importingHardwareIds = false;
                this.showImportModal = false;
                this.resetImportState();
                this.importSuccessMessage = "Hardware-IDs imported successfully.";
            },
            error: (err) => {
                this.importingHardwareIds = false;
                const serverError =
                    err?.error?.error || "Failed to import Hardware-IDs.";
                this.importErrors = [serverError];
            },
        });
    }

    private detectChangedBricklets(
        newBrickletInput: Record<number, string>,
    ): Bricklet[] {
        return Object.entries(newBrickletInput)
            .map(([key, value]) => {
                const brickletNumber = Number(key);
                const existingBricklet =
                    this.brickletService.getBricklet(brickletNumber);
                if (existingBricklet && existingBricklet.uid !== value) {
                    return new Bricklet(
                        value,
                        Number(key),
                        existingBricklet.type,
                    );
                }
                return null;
            })
            .filter((bricklet) => bricklet !== null) as Bricklet[];
    }

    private resetImportState(): void {
        this.importPreview = null;
        this.importErrors = [];
        this.importWarnings = [];
        this.importingHardwareIds = false;
    }
}
