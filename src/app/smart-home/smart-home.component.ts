import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import {SmartHomeService} from "src/app/shared/services/smart-home.service";
import {
    MatterCommissionRequest,
    SmartHomeDevice,
    SmartHomeDomain,
    SmartHomeHubStatus,
} from "src/app/shared/types/smart-home";

type SmartHomeTab = "devices" | "pairing" | "hub";

@Component({
    selector: "app-smart-home",
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: "./smart-home.component.html",
    styleUrls: ["./smart-home.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class SmartHomeComponent implements OnInit {
    activeTab: SmartHomeTab = "devices";

    devices: SmartHomeDevice[] = [];
    hubStatus: SmartHomeHubStatus | null = null;

    selectedRoom: string | null = null;
    searchQuery = "";

    devicesLoading = false;
    hubLoading = false;
    hubInitializing = false;
    pairingSubmitting = false;

    pairingStatusMessage: string | null = null;
    pairingStatusError = false;

    readonly pairingForm: FormGroup;
    readonly commissionDomains: SmartHomeDomain[] = [
        "light",
        "switch",
        "sensor",
        "climate",
        "cover",
        "lock",
    ];

    constructor(
        private readonly smartHomeService: SmartHomeService,
        private readonly changeDetector: ChangeDetectorRef,
        private readonly formBuilder: FormBuilder,
    ) {
        this.pairingForm = this.formBuilder.group({
            pairingCode: ["", Validators.required],
            friendlyName: ["", Validators.required],
            room: ["", Validators.required],
            domain: ["light", Validators.required],
            wifiSsid: [""],
            wifiPassword: [""],
        });
    }

    ngOnInit(): void {
        this.loadDevices();
        this.loadHubStatus();
    }

    get distinctRooms(): string[] {
        const rooms = new Set(
            this.devices.map((device) => device.room).filter((room) => !!room),
        );
        return [...rooms].sort((a, b) => a.localeCompare(b));
    }

    get filteredDevices(): SmartHomeDevice[] {
        const query = this.searchQuery.trim().toLowerCase();
        return this.devices.filter((device) => {
            if (this.selectedRoom && device.room !== this.selectedRoom) {
                return false;
            }
            if (!query) {
                return true;
            }
            return (
                device.friendlyName.toLowerCase().includes(query) ||
                device.entityId.toLowerCase().includes(query) ||
                device.room.toLowerCase().includes(query)
            );
        });
    }

    selectTab(tab: SmartHomeTab): void {
        this.activeTab = tab;
        this.changeDetector.markForCheck();
    }

    selectRoom(room: string | null): void {
        this.selectedRoom = room;
        this.changeDetector.markForCheck();
    }

    onSearchInput(event: Event): void {
        this.searchQuery = (event.target as HTMLInputElement).value;
        this.changeDetector.markForCheck();
    }

    controlIdForEntity(entityId: string, suffix: string): string {
        return `${suffix}-${entityId.replace(/\./g, "-")}`;
    }

    isToggleDomain(domain: SmartHomeDomain): boolean {
        return (
            domain === "light" ||
            domain === "switch" ||
            domain === "lock" ||
            domain === "scene"
        );
    }

    isDeviceOn(device: SmartHomeDevice): boolean {
        return (
            device.state === "on" ||
            device.state === "open" ||
            device.state === "unlocked"
        );
    }

    deviceBrightness(device: SmartHomeDevice): number {
        const brightness =
            device.attributes["brightness_pct"] ??
            device.attributes["brightness"] ??
            0;
        return Math.min(100, Math.max(0, Number(brightness) || 0));
    }

    climateTargetTemperature(device: SmartHomeDevice): number {
        const temp =
            device.attributes["temperature"] ??
            device.attributes["target_temp"] ??
            20;
        return Number(temp) || 20;
    }

    loadDevices(): void {
        this.devicesLoading = true;
        this.smartHomeService.getDevices().subscribe({
            next: (response) => {
                this.devices = response.devices ?? [];
                this.devicesLoading = false;
                this.changeDetector.markForCheck();
            },
            error: () => {
                this.devicesLoading = false;
                this.changeDetector.markForCheck();
            },
        });
    }

    loadHubStatus(): void {
        this.hubLoading = true;
        this.smartHomeService.getStatus().subscribe({
            next: (status) => {
                this.hubStatus = status;
                this.hubLoading = false;
                this.changeDetector.markForCheck();
            },
            error: () => {
                this.hubLoading = false;
                this.changeDetector.markForCheck();
            },
        });
    }

    toggleVoiceExposure(device: SmartHomeDevice): void {
        const exposeToVoice = !device.exposeToVoice;
        this.smartHomeService
            .updateDevice(device.entityId, {exposeToVoice})
            .subscribe({
                next: (updated) => {
                    this.replaceDevice(updated);
                    this.changeDetector.markForCheck();
                },
            });
    }

    toggleDevice(device: SmartHomeDevice): void {
        const action = this.isDeviceOn(device) ? "turn_off" : "turn_on";
        this.smartHomeService.executeAction(device.entityId, action).subscribe({
            next: (response) => {
                if (response.device) {
                    this.replaceDevice(response.device);
                }
                this.changeDetector.markForCheck();
            },
        });
    }

    setBrightness(device: SmartHomeDevice, event: Event): void {
        const value = Number((event.target as HTMLInputElement).value);
        this.smartHomeService
            .executeAction(device.entityId, "set_brightness", value)
            .subscribe({
                next: (response) => {
                    if (response.device) {
                        this.replaceDevice(response.device);
                    }
                    this.changeDetector.markForCheck();
                },
            });
    }

    adjustClimateTemperature(device: SmartHomeDevice, delta: number): void {
        const next = this.climateTargetTemperature(device) + delta;
        this.smartHomeService
            .executeAction(device.entityId, "set_temperature", next)
            .subscribe({
                next: (response) => {
                    if (response.device) {
                        this.replaceDevice(response.device);
                    }
                    this.changeDetector.markForCheck();
                },
            });
    }

    openCover(device: SmartHomeDevice): void {
        this.smartHomeService
            .executeAction(device.entityId, "open_cover")
            .subscribe({
                next: (response) => {
                    if (response.device) {
                        this.replaceDevice(response.device);
                    }
                    this.changeDetector.markForCheck();
                },
            });
    }

    closeCover(device: SmartHomeDevice): void {
        this.smartHomeService
            .executeAction(device.entityId, "close_cover")
            .subscribe({
                next: (response) => {
                    if (response.device) {
                        this.replaceDevice(response.device);
                    }
                    this.changeDetector.markForCheck();
                },
            });
    }

    deleteDevice(device: SmartHomeDevice): void {
        this.smartHomeService.deleteDevice(device.entityId).subscribe({
            next: () => {
                this.devices = this.devices.filter(
                    (entry) => entry.entityId !== device.entityId,
                );
                this.loadHubStatus();
                this.changeDetector.markForCheck();
            },
        });
    }

    initializeHub(): void {
        this.hubInitializing = true;
        this.smartHomeService.initializeHub().subscribe({
            next: (status) => {
                this.hubStatus = status;
                this.hubInitializing = false;
                this.loadDevices();
                this.changeDetector.markForCheck();
            },
            error: () => {
                this.hubInitializing = false;
                this.changeDetector.markForCheck();
            },
        });
    }

    submitPairing(): void {
        this.pairingStatusMessage = null;
        this.pairingStatusError = false;
        if (this.pairingForm.invalid) {
            this.pairingForm.markAllAsTouched();
            this.pairingStatusMessage = "Please fill in all required fields.";
            this.pairingStatusError = true;
            this.changeDetector.markForCheck();
            return;
        }

        const raw = this.pairingForm.value;
        const payload: MatterCommissionRequest = {
            pairingCode: raw.pairingCode,
            friendlyName: raw.friendlyName,
            room: raw.room,
            domain: raw.domain,
        };
        if (raw.wifiSsid) {
            payload.wifiSsid = raw.wifiSsid;
        }
        if (raw.wifiPassword) {
            payload.wifiPassword = raw.wifiPassword;
        }

        this.pairingSubmitting = true;
        this.smartHomeService.commissionMatterDevice(payload).subscribe({
            next: (response) => {
                this.pairingSubmitting = false;
                if (response.commissioned && response.device) {
                    this.replaceDevice(response.device);
                    this.pairingStatusMessage = `Paired ${response.device.friendlyName} successfully.`;
                    this.pairingStatusError = false;
                    this.pairingForm.reset({
                        pairingCode: "",
                        friendlyName: "",
                        room: "",
                        domain: "light",
                        wifiSsid: "",
                        wifiPassword: "",
                    });
                    this.loadHubStatus();
                } else {
                    this.pairingStatusMessage = "Pairing did not complete.";
                    this.pairingStatusError = true;
                }
                this.changeDetector.markForCheck();
            },
            error: () => {
                this.pairingSubmitting = false;
                this.pairingStatusMessage =
                    "Pairing failed. Check the code and try again.";
                this.pairingStatusError = true;
                this.changeDetector.markForCheck();
            },
        });
    }

    private replaceDevice(updated: SmartHomeDevice): void {
        const index = this.devices.findIndex(
            (entry) => entry.entityId === updated.entityId,
        );
        if (index >= 0) {
            this.devices = [
                ...this.devices.slice(0, index),
                updated,
                ...this.devices.slice(index + 1),
            ];
        } else {
            this.devices = [...this.devices, updated];
        }
    }
}
