import {NgTemplateOutlet} from "@angular/common";
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
import {ConnectedBricklet} from "src/app/shared/types/connected-bricklet";
import {
    patternOrOptionalValidator,
    uniqueValuesValidator,
} from "src/app/shared/validators/bricklet-uid.validator";
import {
    DiagnosticsService,
    HardwareConfig,
} from "../diagnostics/diagnostics.service";

interface UidSelectOption {
    uid: string;
    label: string;
}

@Component({
    selector: "app-hardware-id",
    templateUrl: "./hardware-id.component.html",
    styleUrl: "./hardware-id.component.scss",
    changeDetection: ChangeDetectionStrategy.Default,
    imports: [ReactiveFormsModule, NgTemplateOutlet],
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

    // Devices the hardware really reports (GET /bricklet/connected). The UID
    // selects are filled from this list. Refreshing it does not overwrite a
    // value that is already selected.
    connectedBricklets: ConnectedBricklet[] = [];
    connectedBrickletsLoading = false;
    // True once a read has succeeded, so "not loaded yet" and "loaded, nothing
    // attached" render differently.
    connectedBrickletsLoaded = false;
    // Kept separate from `error`, which belongs to export/import: a failed
    // enumeration must not be cleared by an export and vice versa.
    connectedBrickletsError: string | null = null;

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
                // Re-seed from the cache only while it is the source of truth.
                // With a variant context, this emission is what used to rebuild
                // the form from the stale context and snap a saved UID back.
                if (this.usingFallback) {
                    this.rebuildControllerView();
                }
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

        this.loadConnectedBricklets();
    }

    refreshConnectedBricklets(): void {
        if (this.connectedBrickletsLoading) return;
        this.loadConnectedBricklets();
    }

    /**
     * Port column text. The backend reports the lowercase port letter; the
     * label printed on the board is uppercase, so that is what is shown. A
     * device without a port is the carrier board and must never render as an
     * empty cell.
     */
    portLabel(device: ConnectedBricklet): string {
        return device.port ? device.port.toUpperCase() : "— carrier board";
    }

    portTooltip(device: ConnectedBricklet): string {
        if (!device.port) {
            return "Carrier board: the other Bricklets are plugged into this device, it has no port of its own.";
        }
        const parent = this.connectedBricklets.find(
            (candidate) => candidate.uid === device.parentUid,
        );
        const parentLabel = parent
            ? `${parent.name} ${parent.uid}`
            : device.parentUid
            ? `board ${device.parentUid}`
            : "an unknown board";
        return `Port ${device.port.toUpperCase()} on ${parentLabel}`;
    }

    private loadConnectedBricklets(): void {
        this.connectedBrickletsLoading = true;
        this.connectedBrickletsError = null;

        this.brickletService
            .getConnectedBricklets()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (devices) => {
                    this.connectedBricklets = devices;
                    this.connectedBrickletsLoaded = true;
                    this.connectedBrickletsLoading = false;
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    this.connectedBrickletsLoading = false;
                    // A failed read is not an empty list: drop stale rows so the
                    // error is the only thing shown.
                    this.connectedBricklets = [];
                    this.connectedBrickletsLoaded = false;
                    this.connectedBrickletsError =
                        err?.error?.error ||
                        "Failed to load the connected Bricklets.";
                    this.cdr.markForCheck();
                },
            });
    }

    updateIds() {
        if (!this.brickletUidForm.valid) return;
        const newBrickletInput: Record<number, string> =
            this.brickletUidForm.getRawValue();
        const changedBricklets: Bricklet[] =
            this.detectChangedBricklets(newBrickletInput);

        if (changedBricklets.length === 0) {
            return;
        }
        this.brickletService
            .renameBrickletUid(changedBricklets)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.onBrickletUidsSaved(changedBricklets),
            });
    }

    /**
     * Options for one slot: detected devices whose name starts with the
     * controller's device type (the enumeration adds a version suffix),
     * sorted by port. A stored UID that is not in that list stays as an
     * extra option so the select does not drop it.
     */
    uidOptions(controller: HardwareController): UidSelectOption[] {
        const deviceType = controller.deviceType ?? "";
        const detected = this.connectedBricklets
            .filter((device) => this.matchesDeviceType(device.name, deviceType))
            .slice()
            .sort((a, b) => a.port.localeCompare(b.port));
        const options = detected.map((device) => ({
            uid: device.uid,
            label: this.withAssignmentMark(
                this.detectedLabel(device),
                device.uid,
                controller.number,
            ),
        }));
        const current = this.currentUid(controller.number);
        if (current && !options.some((option) => option.uid === current)) {
            options.push({
                uid: current,
                label: this.withAssignmentMark(
                    `${current} - not detected`,
                    current,
                    controller.number,
                ),
            });
        }
        return options;
    }

    duplicateMessage(slot: number): string | null {
        const others = this.otherSlotsWithUid(this.currentUid(slot), slot);
        if (others.length === 0) {
            return null;
        }
        return this.assignmentPhrase(others);
    }

    /** Configured UID that the hardware is not reporting for this slot. */
    isUndetected(slot: number): boolean {
        const uid = this.currentUid(slot);
        if (!uid) {
            return false;
        }
        const deviceType = this.editableControllers().find(
            (candidate) => candidate.number === slot,
        )?.deviceType;
        if (!deviceType) {
            return true;
        }
        return !this.connectedBricklets.some(
            (device) =>
                device.uid === uid &&
                this.matchesDeviceType(device.name, deviceType),
        );
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

    /**
     * Align the in-memory controller list with what was just stored. The form
     * already shows those values; writing the controls again would hide a
     * snap-back that a cache emission had applied.
     */
    private onBrickletUidsSaved(changed: Bricklet[]): void {
        this.applySavedAddresses(changed);
        this.variantService.reload();
        this.loadConnectedBricklets();
        this.cdr.markForCheck();
    }

    private applySavedAddresses(changed: Bricklet[]): void {
        const saved = new Map(
            changed.map((bricklet) => [bricklet.brickletNumber, bricklet.uid]),
        );
        if (this.hardwareContext) {
            this.hardwareContext = {
                ...this.hardwareContext,
                controllers: this.hardwareContext.controllers.map(
                    (controller) => {
                        const uid = saved.get(controller.number);
                        return uid === undefined
                            ? controller
                            : {...controller, address: uid};
                    },
                ),
            };
        }
        this.bricklets = this.bricklets.map((bricklet) => {
            const uid = saved.get(bricklet.brickletNumber);
            return uid === undefined
                ? bricklet
                : new Bricklet(uid, bricklet.brickletNumber, bricklet.type);
        });
    }

    private editableControllers(): HardwareController[] {
        return [
            ...this.servoGroups.flatMap((group) => group.controllers),
            ...this.relayControllers,
            ...this.rgbControllers,
        ];
    }

    private matchesDeviceType(name: string, deviceType: string): boolean {
        if (!deviceType) {
            return false;
        }
        return name === deviceType || name.startsWith(`${deviceType} `);
    }

    private detectedLabel(device: ConnectedBricklet): string {
        const port = device.port
            ? `Port ${device.port.toUpperCase()}`
            : "carrier board";
        return `${device.uid} - ${device.name} - ${port}`;
    }

    private currentUid(slot: number): string {
        const value = this.brickletUidForm.get(String(slot))?.value;
        return typeof value === "string" ? value : "";
    }

    private otherSlotsWithUid(uid: string, slot: number): number[] {
        if (!uid) {
            return [];
        }
        const values = this.brickletUidForm.getRawValue() as Record<
            string,
            string | null
        >;
        return Object.entries(values)
            .filter(([key, value]) => Number(key) !== slot && value === uid)
            .map(([key]) => Number(key))
            .sort((a, b) => a - b);
    }

    private assignmentPhrase(slots: number[]): string {
        if (slots.length === 1) {
            return `already assigned to slot ${slots[0]}`;
        }
        const leading = slots.slice(0, -1).map(String).join(", ");
        return `already assigned to slots ${leading} and ${slots.at(-1)}`;
    }

    private withAssignmentMark(
        label: string,
        uid: string,
        slot: number,
    ): string {
        const others = this.otherSlotsWithUid(uid, slot);
        if (others.length === 0) {
            return label;
        }
        return `${label} (${this.assignmentPhrase(others)})`;
    }

    private resetImportState(): void {
        this.importPreview = null;
        this.importErrors = [];
        this.importWarnings = [];
        this.importingHardwareIds = false;
    }
}
