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
import {
    Observable,
    Subscription,
    catchError,
    map,
    of,
    switchMap,
    take,
    throwError,
    timer,
} from "rxjs";
import {timeout} from "rxjs/operators";
import {PoseService} from "src/app/shared/services/pose.service";
import {MotorService} from "src/app/shared/services/motor.service";
import {MotorPosition} from "src/app/shared/types/motor-position";

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
    private static readonly POSE_LOOKUP_TIMEOUT_MS = 1500;
    private static readonly RESTING_POSE_NAME = "Startup/Resting";

    /** Delay after moving to resting pose before cutting SSR motor power (tests may shorten). */
    restBeforeOffDelayMs = 1200;

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
        private poseService: PoseService,
        private motorService: MotorService,
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

        if (previousState) {
            this.moveToRestingPoseThenTurnOffRelay(previousState);
        } else {
            this.applySolidStateRelayState(true, previousState);
        }
    }

    private moveToRestingPoseThenTurnOffRelay(previousState: boolean): void {
        this.lookupRestingPoseMotorPositions()
            .pipe(
                switchMap((motorPositions) => {
                    if (!motorPositions) {
                        return of(void 0);
                    }
                    return this.motorService.setPositions(motorPositions).pipe(
                        catchError(() => of(void 0)),
                        switchMap(() => timer(this.restBeforeOffDelayMs)),
                    );
                }),
            )
            .subscribe(() => {
                this.applySolidStateRelayState(false, previousState);
            });
    }

    private lookupRestingPoseMotorPositions(): Observable<
        MotorPosition[] | null
    > {
        return this.poseService.getPosesObservable().pipe(
            take(1),
            switchMap((poses) => {
                const restingPose = poses.find(
                    (pose) =>
                        pose.name === RelayControlComponent.RESTING_POSE_NAME,
                );
                if (!restingPose) {
                    return throwError(
                        () =>
                            new Error(
                                `${RelayControlComponent.RESTING_POSE_NAME} pose not found`,
                            ),
                    );
                }
                return this.poseService
                    .exportPose(restingPose.poseId)
                    .pipe(map((transfer) => transfer.motorPositions));
            }),
            timeout(RelayControlComponent.POSE_LOOKUP_TIMEOUT_MS),
            catchError(() => of(null as MotorPosition[] | null)),
        );
    }

    private applySolidStateRelayState(
        turnedOn: boolean,
        previousState: boolean,
    ): void {
        this.rosService
            .setSolidStateRelayState({turned_on: turnedOn})
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
