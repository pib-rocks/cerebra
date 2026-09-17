import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ElementRef,
    ViewChild,
    DestroyRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
    FormControl,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from "@angular/forms";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {HardwareController} from "src/app/shared/types/hardware-capabilities";
import {
    HardwareContext,
    VariantService,
} from "src/app/shared/services/variant.service";
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
    private readonly destroyRef = inject(DestroyRef);

    @ViewChild("hardwareImportInput")
    hardwareImportInput?: ElementRef<HTMLInputElement>;

    servoGroups: Array<{
        supplyVoltage: number | null;
        controllers: HardwareController[];
    }> = [];
    relayControllers: HardwareController[] = [];
    rgbControllers: HardwareController[] = [];
    serialControllers: HardwareController[] = [];
    canControllers: HardwareController[] = [];
    showCanDocumentation = false;
    usingFallback = true;
    brickletUidForm = new FormGroup({}, {validators: uniqueValuesValidator()});

    private bricklets: Bricklet[] = [];
    private hardwareContext?: HardwareContext;

    exportingHardwareIds = false;
    importingHardwareIds = false;
    showImportModal = false;
    importPreview: HardwareConfig | null = null;
    importErrors: string[] = [];
    importWarnings: string[] = [];
    importSuccessMessage: string | null = null;
    error: string | null = null;

    get hasEditableControllers(): boolean {
        return Object.keys(this.brickletUidForm.controls).length > 0;
    }

    get importPreviewBricklets() {
        return this.importPreview?.bricklets ?? [];
    }

    get importPreviewControllers() {
        return this.importPreview?.controllers ?? [];
    }

    constructor(
        private brickletService: BrickletService,
        private variantService: VariantService,
        private diagnosticsService: DiagnosticsService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.brickletService
            .getBrickletObservable()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((bricklets) => {
                this.bricklets = bricklets;
                this.rebuildControllerView();
                this.cdr.markForCheck();
            });

        this.variantService
            .getContextObservable()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((context) => {
                this.hardwareContext = context;
                this.rebuildControllerView();
                this.cdr.markForCheck();
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
                this.importSuccessMessage =
                    "Hardware-IDs exported successfully.";
                this.cdr.markForCheck();
            },
            error: () => {
                this.exportingHardwareIds = false;
                this.error = "Failed to export Hardware-IDs.";
                this.cdr.markForCheck();
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

        this.importPreview = null;
        this.importErrors = [];
        this.importWarnings = [];
        this.importSuccessMessage = null;

        if (!file) {
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const content =
                typeof reader.result === "string" ? reader.result : "";
            const result =
                this.diagnosticsService.parseHardwareConfigFileContent(content);
            this.importErrors = result.errors;
            this.importWarnings = result.warnings;
            this.importPreview = result.valid ? result.config ?? null : null;
            input.value = "";
            // The app runs zoneless, so this FileReader callback has to notify
            // change detection itself for the preview to render.
            this.cdr.markForCheck();
        };
        reader.onerror = () => {
            this.importErrors = ["The selected file could not be read."];
            this.importPreview = null;
            input.value = "";
            this.cdr.markForCheck();
        };
        reader.readAsText(file);
    }

    confirmHardwareImport(): void {
        if (!this.importPreview || this.importingHardwareIds) {
            return;
        }

        this.importingHardwareIds = true;
        this.error = null;

        this.diagnosticsService
            .importHardwareConfig(this.importPreview)
            .subscribe({
                next: () => {
                    this.importingHardwareIds = false;
                    this.showImportModal = false;
                    this.resetImportState();
                    this.importSuccessMessage =
                        "Hardware-IDs imported successfully.";
                    this.brickletService.reloadBrickletsFromDb();
                    this.variantService.reload();
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    this.importingHardwareIds = false;
                    const serverError =
                        err?.error?.error || "Failed to import Hardware-IDs.";
                    this.importErrors = [serverError];
                    this.cdr.markForCheck();
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

    private rebuildControllerView(): void {
        const context = this.hardwareContext;
        const usingFallback = !context || context.fallback;
        this.usingFallback = usingFallback;

        const controllers = usingFallback
            ? this.bricklets.map((bricklet) => ({
                  kind: "tinkerforge_bricklet",
                  deviceType: bricklet.type,
                  address: bricklet.uid,
                  number: bricklet.brickletNumber,
                  supplyVoltage: null,
              }))
            : this.limitControllersToDeclaredCounts(context);

        const servoControllers = controllers.filter(
            (controller) =>
                controller.kind === "tinkerforge_bricklet" &&
                controller.deviceType === "Servo Bricklet",
        );
        this.servoGroups = this.groupServosByVoltage(servoControllers);
        this.relayControllers = controllers.filter(
            (controller) =>
                controller.kind === "tinkerforge_bricklet" &&
                controller.deviceType === "Solid State Relay Bricklet",
        );
        this.rgbControllers = controllers.filter(
            (controller) =>
                controller.kind === "tinkerforge_bricklet" &&
                controller.deviceType === "RGB LED Button Bricklet",
        );
        this.serialControllers = controllers.filter(
            (controller) => controller.kind === "feetech_st_serial",
        );
        this.canControllers = controllers.filter(
            (controller) => controller.kind === "robstride_can",
        );
        this.showCanDocumentation =
            this.canControllers.length > 0 ||
            Boolean(
                context &&
                    !context.fallback &&
                    context.variant.variant === "pib5museum" &&
                    context.capabilities.some(
                        (capability) => capability.kind === "robstride_can",
                    ),
            );

        this.syncUidControls(
            controllers.filter(
                (controller) => controller.kind === "tinkerforge_bricklet",
            ),
        );
    }

    private limitControllersToDeclaredCounts(
        context: HardwareContext,
    ): HardwareController[] {
        const remaining = new Map(
            context.capabilities.map((capability) => [
                capability.kind,
                capability.installedControllers,
            ]),
        );

        return context.controllers.filter((controller) => {
            const count = remaining.get(controller.kind) ?? 0;
            if (count <= 0) return false;
            remaining.set(controller.kind, count - 1);
            return true;
        });
    }

    private groupServosByVoltage(controllers: HardwareController[]): Array<{
        supplyVoltage: number | null;
        controllers: HardwareController[];
    }> {
        const groups = new Map<number | null, HardwareController[]>();
        controllers.forEach((controller) => {
            const group = groups.get(controller.supplyVoltage) ?? [];
            group.push(controller);
            groups.set(controller.supplyVoltage, group);
        });
        return Array.from(groups, ([supplyVoltage, groupedControllers]) => ({
            supplyVoltage,
            controllers: groupedControllers,
        }));
    }

    private syncUidControls(controllers: HardwareController[]): void {
        const desiredControls = new Set(
            controllers.map((controller) => controller.number.toString()),
        );
        Object.keys(this.brickletUidForm.controls).forEach((controlName) => {
            if (!desiredControls.has(controlName)) {
                this.brickletUidForm.removeControl(controlName);
            }
        });

        controllers.forEach((controller) => {
            const controlName = controller.number.toString();
            const value = controller.address ?? "";
            if (this.brickletUidForm.contains(controlName)) {
                this.brickletUidForm.get(controlName)?.setValue(value);
            } else {
                this.brickletUidForm.addControl(
                    controlName,
                    new FormControl(value, [
                        Validators.maxLength(6),
                        patternOrOptionalValidator(),
                    ]),
                );
            }
        });
        this.brickletUidForm.updateValueAndValidity();
    }

    private resetImportState(): void {
        this.importPreview = null;
        this.importErrors = [];
        this.importWarnings = [];
        this.importingHardwareIds = false;
    }
}
