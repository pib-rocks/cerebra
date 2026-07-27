import {Component, OnInit, OnDestroy, ChangeDetectionStrategy} from "@angular/core";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Subscription} from "rxjs";

@Component({
    selector: "app-relay-control",
    templateUrl: "./relay-control.component.html",
    styleUrls: ["./relay-control.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class RelayControlComponent implements OnInit, OnDestroy {
    turnedOn = false;
    isRelayAvailable = false;
    isLoading = false;

    private hasConfiguredRelay = false;
    private hasRosState = false;
    private subscriptions = new Subscription();

    constructor(
        private rosService: RosService,
        private brickletService: BrickletService,
        private matSnackBarService: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.subscriptions.add(
            this.brickletService.getBrickletObservable().subscribe((bricklets) => {
                this.hasConfiguredRelay = bricklets.some(
                    (b) =>
                        b.type === "Solid State Relay Bricklet" &&
                        !!b.uid &&
                        b.uid.trim() !== "",
                );
                this.updateRelayAvailability();
            }),
        );

        // set current state of SSR (in case another user is using it)
        this.subscriptions.add(
            this.rosService.solidStateRelayStateReceiver$.subscribe({
                next: (state) => {
                    if (state) {
                        this.hasRosState = true;
                        this.turnedOn = state.turned_on;
                    } else {
                        this.hasRosState = false;
                    }
                    this.updateRelayAvailability();
                },
            }),
        );
    }

    private updateRelayAvailability(): void {
        this.isRelayAvailable = this.hasConfiguredRelay || this.hasRosState;
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
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
