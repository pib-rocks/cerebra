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
import {Subject} from "rxjs";
import {routes} from "src/app/app-routing.module";
import {JointControlComponent} from "src/app/joint-control/joint-control.component";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {JointStateMessage} from "src/app/shared/ros-types/msg/joint-state-message";
import {PibRobotView} from "@pib/robot-view";
import {Robot3DComponent, jointStateStampMs} from "./robot-3d.component";

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

describe("Robot3DComponent", () => {
    let fixture: ComponentFixture<Robot3DComponent>;
    let jointStates$: Subject<JointStateMessage>;
    let viewer: PibRobotView;

    beforeEach(async () => {
        jointStates$ = new Subject<JointStateMessage>();
        await TestBed.configureTestingModule({
            imports: [Robot3DComponent],
            providers: [
                {
                    provide: RosService,
                    useValue: {jointStatesReceiver$: jointStates$},
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Robot3DComponent);
        fixture.detectChanges();
        viewer = fixture.nativeElement.querySelector(
            "pib-robot-view",
        ) as PibRobotView;
        spyOn(viewer, "setJointStateSample");
        spyOn(viewer, "dispose");
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
