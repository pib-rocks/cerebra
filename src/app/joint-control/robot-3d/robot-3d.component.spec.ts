import {Component} from "@angular/core";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {
    ActivatedRouteSnapshot,
    Route,
    Router,
    RouterOutlet,
    provideRouter,
} from "@angular/router";
import {RouterTestingHarness} from "@angular/router/testing";
import {Subject, of, throwError} from "rxjs";
import {routes} from "src/app/app-routing.module";
import {JointControlComponent} from "src/app/joint-control/joint-control.component";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {JointStateMessage} from "src/app/shared/ros-types/msg/joint-state-message";
import {CommandRequestDetail, PibRobotView} from "@pib/robot-view";
import {ApiService} from "src/app/shared/services/api.service";
import {
    Robot3DComponent,
    jointStateStampMs,
    jointTrajectoryFromCommandMotors,
    trajectoryPointPositionsRad,
} from "./robot-3d.component";

@Component({
    selector: "app-route-stub",
    template: "<router-outlet></router-outlet>",
    imports: [RouterOutlet],
})
class RouteStubComponent {}

function stubbed(route: Route): Route {
    const {
        loadComponent,
        component,
        resolve: _resolve,
        canActivate: _canActivate,
        children,
        ...rest
    } = route;
    const copy: Route = {...rest};
    if (route.path === "3d") {
        copy.component = Robot3DComponent;
    } else if (loadComponent != null || component != null) {
        copy.component = RouteStubComponent;
    }
    if (children != null) {
        copy.children = children.map(stubbed);
    }
    return copy;
}

function jointControlRoute(): Route {
    const route = routes.find((item) => item.path === "joint-control");
    expect(route).toBeDefined();
    return stubbed(route as Route);
}

function leaf(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = snapshot;
    while (current.firstChild != null) {
        current = current.firstChild;
    }
    return current;
}

describe("jointStateStampMs", () => {
    it("derives milliseconds from header stamp", () => {
        expect(
            jointStateStampMs({
                stamp: {sec: 10, nanosec: 2_500_000},
                frame_id: "",
            }),
        ).toBe(10_002);
    });
});

describe("jointTrajectoryFromCommandMotors", () => {
    it("builds one trajectory point with motor names and centidegree positions", () => {
        const motors = {head_pan: 9000, head_tilt: -4500};
        const trajectory = jointTrajectoryFromCommandMotors(motors);

        expect(trajectory.joint_names).toEqual(["head_pan", "head_tilt"]);
        expect(trajectory.points.length).toBe(1);
        expect(trajectory.points[0].positions).toEqual([9000, -4500]);
    });
});

describe("trajectoryPointPositionsRad", () => {
    it("converts centidegrees to radians", () => {
        expect(trajectoryPointPositionsRad({head_pan: 9000})[0]).toBeCloseTo(
            1.5708,
            4,
        );
    });
});

describe("Robot3DComponent", () => {
    let fixture: ComponentFixture<Robot3DComponent>;
    let jointStates$: Subject<JointStateMessage>;
    let applyJointTrajectory$: Subject<void>;
    let applyJointTrajectory: jasmine.Spy;
    let apiService: jasmine.SpyObj<ApiService>;
    let viewer: PibRobotView;
    let modeSpy: jasmine.Spy;

    beforeEach(async () => {
        jointStates$ = new Subject<JointStateMessage>();
        applyJointTrajectory$ = new Subject<void>();
        applyJointTrajectory = jasmine
            .createSpy("applyJointTrajectory")
            .and.returnValue(applyJointTrajectory$.asObservable());
        apiService = jasmine.createSpyObj("ApiService", ["get"]);
        apiService.get.and.returnValue(
            of({
                motors: [
                    {
                        name: "head_pan",
                        rotationRangeMin: -9000,
                        rotationRangeMax: 9000,
                    },
                ],
            }),
        );

        await TestBed.configureTestingModule({
            imports: [Robot3DComponent],
            providers: [
                {
                    provide: RosService,
                    useValue: {
                        jointStatesReceiver$: jointStates$,
                        applyJointTrajectory,
                    },
                },
                {provide: ApiService, useValue: apiService},
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Robot3DComponent);
        fixture.detectChanges();
        viewer = fixture.nativeElement.querySelector(
            "pib-robot-view",
        ) as PibRobotView;
        spyOn(viewer, "setJointStateSample");
        spyOn(viewer, "dispose");
        spyOn(viewer, "confirmCommand");
        spyOn(viewer, "rejectCommand");
        spyOn(viewer, "setExpectedMotors");
        // The component switches the element to command mode when the limits arrive. Spy on the
        // setter: a real switch would make the element fetch model.json and mapping.json, which
        // this test does not stub.
        modeSpy = spyOnProperty(viewer, "mode", "set");
    });

    it("forwards joint state samples to the viewer", () => {
        const message: JointStateMessage = {
            header: {
                stamp: {sec: 5, nanosec: 0},
                frame_id: "base",
            },
            name: ["motor_a", "motor_b"],
            position: [0.1, -0.2],
        };

        jointStates$.next(message);

        expect(viewer.setJointStateSample).toHaveBeenCalledWith({
            names: ["motor_a", "motor_b"],
            positions: [0.1, -0.2],
            stampMs: 5000,
        });
    });

    it("switches the viewer to command mode once the limits are in", () => {
        // The element decides on its own gate (verified mapping, model/robot match); the tab only
        // has to ask for command at all - it was hardcoded to read before.
        viewer.dispatchEvent(new CustomEvent("ready"));
        expect(modeSpy).toHaveBeenCalledWith("command");
    });

    it("sets motor limits on the viewer when the model is ready", () => {
        viewer.dispatchEvent(new CustomEvent("ready"));

        expect(viewer.limits).toEqual({
            head_pan: {minDeg: -90, maxDeg: 90},
        });
    });

    it("hands the robot's motor names to the viewer for the consistency check", () => {
        viewer.dispatchEvent(new CustomEvent("ready"));

        expect(viewer.setExpectedMotors).toHaveBeenCalledWith(["head_pan"]);
    });

    it("confirms a successful command and logs audit data", () => {
        const detail: CommandRequestDetail = {
            commandId: "cmd-1",
            values: {head_pan: 0.5},
            motors: {head_pan: 9000},
            source: "ui",
        };
        spyOn(console, "info");

        viewer.dispatchEvent(
            new CustomEvent("commandrequest", {detail, cancelable: true}),
        );
        applyJointTrajectory$.next();
        applyJointTrajectory$.complete();
        fixture.detectChanges();

        expect(applyJointTrajectory).toHaveBeenCalledOnceWith(
            jointTrajectoryFromCommandMotors(detail.motors),
        );
        expect(viewer.confirmCommand).toHaveBeenCalledWith("cmd-1");
        expect(console.info).toHaveBeenCalledWith("command", {
            commandId: "cmd-1",
            joints: {head_pan: 0.5},
            source: "ui",
            ok: true,
        });
    });

    it("rejects a failed command and shows per-motor errors", () => {
        const detail: CommandRequestDetail = {
            commandId: "cmd-2",
            values: {head_pan: 0.5, head_tilt: 0.1},
            motors: {head_pan: 100, head_tilt: 200},
            source: "api",
        };
        applyJointTrajectory.and.returnValue(
            throwError(() => new Error("trajectory rejected")),
        );

        viewer.dispatchEvent(
            new CustomEvent("commandrequest", {detail, cancelable: true}),
        );
        fixture.detectChanges();

        expect(viewer.rejectCommand).toHaveBeenCalledWith(
            "cmd-2",
            "trajectory rejected",
        );
        expect(fixture.componentInstance.commandError).toBe(
            "head_pan: trajectory rejected; head_tilt: trajectory rejected",
        );
    });

    it("unsubscribes and disposes the viewer on destroy", () => {
        const subscription = (fixture.componentInstance as any).subscription;
        spyOn(subscription, "unsubscribe").and.callThrough();

        fixture.destroy();

        expect(subscription.unsubscribe).toHaveBeenCalled();
        expect(viewer.dispose).toHaveBeenCalled();
    });
});

describe("joint-control 3d route", () => {
    let harness: RouterTestingHarness;
    let router: Router;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [JointControlComponent, Robot3DComponent],
            providers: [
                provideRouter([jointControlRoute()]),
                {
                    provide: RosService,
                    useValue: {
                        jointStatesReceiver$: new Subject(),
                    },
                },
                {
                    provide: ApiService,
                    useValue: {
                        get: () =>
                            of({
                                motors: [],
                            }),
                    },
                },
            ],
        });
        harness = await RouterTestingHarness.create();
        router = TestBed.inject(Router);
    });

    it("activates Robot3DComponent at /joint-control/3d", async () => {
        await harness.navigateByUrl("/joint-control/3d");

        expect(router.url).toBe("/joint-control/3d");
        const active = leaf(router.routerState.snapshot.root);
        expect(active.routeConfig?.path).toBe("3d");
        expect(active.routeConfig?.component).toBe(Robot3DComponent);
    });

    it("does not treat 3d as a joint-name parameter route", async () => {
        await harness.navigateByUrl("/joint-control/3d");

        const active = leaf(router.routerState.snapshot.root);
        expect(active.routeConfig?.path).not.toBe(":joint-name");
        expect(active.routeConfig?.component).toBe(Robot3DComponent);
    });
});
