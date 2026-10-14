import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
} from "@angular/core";
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
    /**
     * How long the toggle waits for an acknowledgement before it lets the operator try again. The
     * node's state message arrives well inside this window.
     */
    private static readonly RELAY_ACK_TIMEOUT_MS = 5000;

    turnedOn = false;
    isRelayAvailable = false;
    isLoading = false;

    private hasConfiguredRelay = false;
    private hasRosState = false;
    private subscriptions = new Subscription();
    private ackTimer?: ReturnType<typeof setTimeout>;

    constructor(
        private rosService: RosService,
        private brickletService: BrickletService,
        private matSnackBarService: MatSnackBar,
        private changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.subscriptions.add(
            this.brickletService
                .getBrickletObservable()
                .subscribe((bricklets) => {
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
                        // The node broadcasts the state it applied - that is the acknowledgement which
                        // releases the toggle when the service response never arrives.
                        this.releaseRelayLoading();
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
        this.clearAckTimer();
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
                    this.releaseRelayLoading();
                },
                error: (error) => {
                    console.error("Failed to set SSR state:", error);
                    this.turnedOn = previousState;
                    this.matSnackBarService.open(
                        "Error! SSR could not be set.",
                        "",
                        {panelClass: "cerebra-toast", duration: 3000},
                    );
                    this.releaseRelayLoading();
                },
            });
        // rosbridge can lose the service response. Without this the button stayed disabled until the
        // page was reloaded, although the relay had switched.
        this.startAckDeadline();
    }

    /** The node's state message is the acknowledgement - release the toggle as soon as it arrives. */
    private releaseRelayLoading(): void {
        this.clearAckTimer();
        if (!this.isLoading) {
            return;
        }
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
    }

    /**
     * Last resort so a lost response cannot lock the control: after the deadline the operator may try
     * again. The relay state itself still comes from the node's topic.
     */
    private startAckDeadline(): void {
        this.clearAckTimer();
        this.ackTimer = setTimeout(() => {
            this.ackTimer = undefined;
            this.releaseRelayLoading();
        }, RelayControlComponent.RELAY_ACK_TIMEOUT_MS);
    }

    private clearAckTimer(): void {
        if (this.ackTimer === undefined) {
            return;
        }
        clearTimeout(this.ackTimer);
        this.ackTimer = undefined;
    }
}
