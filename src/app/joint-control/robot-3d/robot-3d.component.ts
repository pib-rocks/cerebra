import "@pib/robot-view";

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    ElementRef,
    OnDestroy,
    ViewChild,
} from "@angular/core";
import {Subscription} from "rxjs";
import {CommandRequestDetail, PibRobotView} from "@pib/robot-view";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {JointStateMessage} from "src/app/shared/ros-types/msg/joint-state-message";
import {StdMessageHeader} from "src/app/shared/ros-types/msg/std-message-header";
import {
    JointTrajectoryMessage,
    createEmptyJointTrajectoryMessage,
} from "src/app/shared/ros-types/msg/joint-trajectory-message";
import {centidegToRad} from "src/app/shared/types/joint-angle-units";
import {RobotLimitsService, RobotMotorLimitsMap} from "./robot-limits.service";

export function jointStateStampMs(
    header: StdMessageHeader | undefined,
): number {
    const stamp = header?.stamp;
    if (stamp == null) {
        return Date.now();
    }
    return stamp.sec * 1000 + Math.floor(stamp.nanosec / 1_000_000);
}

/** Positions are centidegrees — {@link RosService.applyJointTrajectory} converts to radians. */
export function jointTrajectoryFromCommandMotors(
    motors: Record<string, number>,
): JointTrajectoryMessage {
    const joint_names = Object.keys(motors);
    const message = createEmptyJointTrajectoryMessage();
    message.joint_names = joint_names;
    message.points = [
        {
            positions: joint_names.map((name) => motors[name]),
            time_from_start: {sec: 0, nanosec: 0},
        },
    ];
    return message;
}

export function trajectoryPointPositionsRad(
    motors: Record<string, number>,
): number[] {
    return Object.keys(motors).map((name) => centidegToRad(motors[name]));
}

@Component({
    selector: "app-robot-3d",
    providers: [RobotLimitsService],
    template: `
        @if (loadError) {
            <p class="robot-3d-error">{{ loadError }}</p>
        }
        @if (commandError) {
            <p class="robot-3d-error">{{ commandError }}</p>
        }
        <pib-robot-view
            #robotView
            class="robot-3d-view"
            [mode]="viewerMode"
            model-url="/api/robot-model/model.json"
            mapping-url="/api/robot-model/mapping.json"
            [class.d-none]="loadError"></pib-robot-view>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                min-height: 28rem;
            }

            .robot-3d-view {
                display: block;
                width: 100%;
                min-height: 28rem;
            }

            .robot-3d-error {
                margin: 0;
                padding: 1rem;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Robot3DComponent implements AfterViewInit, OnDestroy {
    @ViewChild("robotView") robotViewRef?: ElementRef<PibRobotView>;

    loadError: string | null = null;
    commandError: string | null = null;
    /** `command` only once the model and the limits are there; before that the element would
     *  request a mapping it has not fetched yet. The element still falls back to preview when its
     *  own gate refuses (unverified mapping, model/robot mismatch) and shows why in its banner. */
    get viewerMode(): "read" | "command" {
        return this.modelReady && this.limitsMap !== null ? "command" : "read";
    }

    private subscription?: Subscription;
    private limitsSubscription?: Subscription;
    private errorListener?: (event: Event) => void;
    private readyListener?: (event: Event) => void;
    private commandListener?: (event: Event) => void;
    private modelReady = false;
    private limitsMap: RobotMotorLimitsMap | null = null;

    constructor(
        private readonly rosService: RosService,
        private readonly robotLimitsService: RobotLimitsService,
    ) {}

    ngAfterViewInit(): void {
        const element = this.robotViewRef?.nativeElement;
        if (element) {
            this.errorListener = (event: Event) => {
                const detail = (event as CustomEvent<{message?: string}>)
                    .detail;
                this.loadError =
                    detail?.message ??
                    "Robot model is not available. Install the model via the backend.";
            };
            element.addEventListener("error", this.errorListener);

            this.readyListener = () => {
                this.modelReady = true;
                this.applyLimitsToViewer();
            };
            element.addEventListener("ready", this.readyListener);

            this.commandListener = (event: Event) => {
                const detail = (event as CustomEvent<CommandRequestDetail>)
                    .detail;
                this.handleCommandRequest(detail);
            };
            element.addEventListener("commandrequest", this.commandListener);
        }

        this.limitsSubscription = this.robotLimitsService
            .loadLimits()
            .subscribe((limits) => {
                this.limitsMap = limits;
                this.applyLimitsToViewer();
            });

        this.subscription = this.rosService.jointStatesReceiver$.subscribe(
            (message: JointStateMessage) => {
                this.forwardJointState(message);
            },
        );
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.limitsSubscription?.unsubscribe();
        const element = this.robotViewRef?.nativeElement;
        if (element) {
            if (this.errorListener) {
                element.removeEventListener("error", this.errorListener);
            }
            if (this.readyListener) {
                element.removeEventListener("ready", this.readyListener);
            }
            if (this.commandListener) {
                element.removeEventListener(
                    "commandrequest",
                    this.commandListener,
                );
            }
        }
        element?.dispose();
    }

    private applyLimitsToViewer(): void {
        const element = this.robotViewRef?.nativeElement;
        if (!element || !this.modelReady || this.limitsMap === null) {
            return;
        }
        element.limits = this.limitsMap;
        // The same list the limits come from: if the model's mapping names a motor this robot
        // does not have (or misses one), the viewer goes read-only instead of posing a robot
        // that does not exist.
        element.setExpectedMotors(Object.keys(this.limitsMap));
    }

    private handleCommandRequest(detail: CommandRequestDetail): void {
        const viewer = this.robotViewRef?.nativeElement;
        if (!viewer) {
            return;
        }
        const trajectory = jointTrajectoryFromCommandMotors(detail.motors);
        this.rosService.applyJointTrajectory(trajectory).subscribe({
            next: () => {
                this.commandError = null;
                viewer.confirmCommand(detail.commandId);
                console.info("command", {
                    commandId: detail.commandId,
                    joints: detail.values,
                    source: detail.source,
                    ok: true,
                });
            },
            error: (err: unknown) => {
                const message =
                    err instanceof Error
                        ? err.message
                        : "failed to apply joint-trajectory.";
                viewer.rejectCommand(detail.commandId, message);
                this.commandError = Object.keys(detail.motors)
                    .map((motor) => `${motor}: ${message}`)
                    .join("; ");
            },
        });
    }

    private forwardJointState(message: JointStateMessage): void {
        if (this.loadError) {
            return;
        }
        const viewer = this.robotViewRef?.nativeElement;
        if (!viewer) {
            return;
        }
        viewer.setJointStateSample({
            names: message.name,
            positions: message.position,
            stampMs: jointStateStampMs(message.header),
        });
    }
}
