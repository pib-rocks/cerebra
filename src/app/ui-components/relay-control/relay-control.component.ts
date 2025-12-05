import {Component, OnInit} from "@angular/core";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
    selector: "app-relay-control",
    templateUrl: "./relay-control.component.html",
    styleUrls: ["./relay-control.component.scss"],
})
export class RelayControlComponent implements OnInit {
    turnedOn = false;
    isRelayAvailable = false;
    isLoading = false;

    constructor(
        private rosService: RosService,
        private matSnackBarService: MatSnackBar,
    ) {}

    ngOnInit(): void {
        // set current state of SSR (in case another user is using it)
        this.rosService.solidStateRelayStateReceiver$.subscribe({
            next: (state) => {
                if (state) {
                    this.isRelayAvailable = true;
                    this.turnedOn = state.turned_on;
                } else {
                    this.isRelayAvailable = false;
                }
            },
        });
    }

    toggleSolidStateRelay() {
        if (!this.isRelayAvailable || this.isLoading) return;

        this.isLoading = true;
        const previousState = this.turnedOn;
        this.turnedOn = !previousState;
        this.rosService
            .setSolidStateRelayState({turned_on: this.turnedOn})
            .subscribe({
                next: () => {
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error("Failed to set SSR state:", error);
                    this.turnedOn = previousState;
                    this.matSnackBarService.open(
                        "Error! SSR could not be set.",
                        "",
                        {panelClass: "cerebra-toast", duration: 3000},
                    );
                    this.isLoading = false;
                },
            });
    }
}
