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
import {PibRobotView} from "@pib/robot-view";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {JointStateMessage} from "src/app/shared/ros-types/msg/joint-state-message";
import {StdMessageHeader} from "src/app/shared/ros-types/msg/std-message-header";

export function jointStateStampMs(
    header: StdMessageHeader | undefined,
): number {
    const stamp = header?.stamp;
    if (stamp == null) {
        return Date.now();
    }
    return stamp.sec * 1000 + Math.floor(stamp.nanosec / 1_000_000);
}

@Component({
    selector: "app-robot-3d",
    template: `
        @if (loadError) {
            <p class="robot-3d-error">{{ loadError }}</p>
        }
        <pib-robot-view
            #robotView
            class="robot-3d-view"
            mode="read"
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

    private subscription?: Subscription;
    private errorListener?: (event: Event) => void;

    constructor(private readonly rosService: RosService) {}

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
        }

        this.subscription = this.rosService.jointStatesReceiver$.subscribe(
            (message: JointStateMessage) => {
                this.forwardJointState(message);
            },
        );
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        const element = this.robotViewRef?.nativeElement;
        if (element && this.errorListener) {
            element.removeEventListener("error", this.errorListener);
        }
        element?.dispose();
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
