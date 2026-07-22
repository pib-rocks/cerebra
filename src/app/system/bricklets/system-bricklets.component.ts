import {Component, OnInit} from "@angular/core";
import {SystemInfoService} from "src/app/shared/services/system-info.service";
import {BrickletStatus} from "src/app/shared/types/system-info";

@Component({
    selector: "app-system-bricklets",
    templateUrl: "./system-bricklets.component.html",
    styleUrls: ["./system-bricklets.component.scss"],
})
export class SystemBrickletsComponent implements OnInit {
    bricklets: BrickletStatus[] = [];
    tinkerforgeConnected = false;
    loading = false;
    error: string | null = null;

    constructor(private systemInfoService: SystemInfoService) {}

    ngOnInit(): void {
        this.refresh();
    }

    refresh(): void {
        this.loading = true;
        this.error = null;
        this.systemInfoService.getBrickletsStatus().subscribe({
            next: (response) => {
                this.bricklets = response.bricklets;
                this.tinkerforgeConnected = response.tinkerforgeConnected;
                this.loading = false;
            },
            error: (err) => {
                this.error =
                    err?.error?.error || "Unable to load bricklet status.";
                this.loading = false;
            },
        });
    }

    get servoBricklets(): BrickletStatus[] {
        return this.bricklets.filter((b) => b.type === "Servo Bricklet");
    }

    get relayBricklets(): BrickletStatus[] {
        return this.bricklets.filter(
            (b) => b.type === "Solid State Relay Bricklet",
        );
    }

    get rgbBricklets(): BrickletStatus[] {
        return this.bricklets.filter(
            (b) => b.type === "RGB LED Button Bricklet",
        );
    }

    colorCss(color: {r: number; g: number; b: number} | null): string {
        if (!color) {
            return "transparent";
        }
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    formatVersion(version: number[] | undefined): string {
        return version ? version.join(".") : "—";
    }
}
