import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {BehaviorSubject, Subject, of} from "rxjs";
import {ModelStatusArray} from "../../shared/ros-types/msg/model-status";
import {ModelInfo} from "../../shared/ros-types/srv/list-models";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {ModelListComponent} from "./model-list.component";

describe("ModelListComponent", () => {
    let component: ModelListComponent;
    let fixture: ComponentFixture<ModelListComponent>;
    let rosService: jasmine.SpyObj<RosService>;
    let status$: BehaviorSubject<ModelStatusArray>;

    const handTracking: ModelInfo = {
        model_id: "hand_tracking",
        task: "hand tracking",
        licence: "Apache-2.0",
        shaves: [4, 1, 4],
        size_bytes: 10485760,
        available: true,
        active: false,
    };
    const objectDetection: ModelInfo = {
        ...handTracking,
        model_id: "object_detection",
        task: "object detection",
        shaves: [6],
    };

    beforeEach(async () => {
        status$ = new BehaviorSubject<ModelStatusArray>({models: []});
        rosService = jasmine.createSpyObj<RosService>(
            "RosService",
            ["listModels", "startModel", "stopModel"],
            {
                modelStatusReceiver$: status$,
                connectionStatus$: new BehaviorSubject(true),
            },
        );
        rosService.listModels.and.returnValue(of([handTracking]));

        await TestBed.configureTestingModule({
            imports: [ModelListComponent],
            providers: [{provide: RosService, useValue: rosService}],
        }).compileComponents();

        fixture = TestBed.createComponent(ModelListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("renders every model as a switch without a table", () => {
        const text = fixture.nativeElement.textContent;
        expect(text).toContain("hand_tracking");
        expect(text).toContain("hand tracking");
        expect(fixture.nativeElement.querySelector("table")).toBeNull();
        expect(
            fixture.nativeElement.querySelector(
                'input[type="checkbox"][role="switch"]',
            ),
        ).not.toBeNull();
    });

    it("replaces live state and allows starting to recover to running", () => {
        status$.next({
            models: [
                {
                    model_id: "hand_tracking",
                    state: "starting",
                    fps: 0,
                    active: true,
                },
            ],
        });
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("starting");

        status$.next({
            models: [
                {
                    model_id: "hand_tracking",
                    state: "running",
                    fps: 18.25,
                    active: true,
                },
            ],
        });
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("running");
        expect(fixture.nativeElement.textContent).toContain("18.3");
    });

    it("starts a model from its switch and shows the restart", () => {
        const action = new Subject<void>();
        rosService.startModel.and.returnValue(action);

        component.setModelActive(handTracking, true);
        fixture.detectChanges();

        expect(rosService.startModel).toHaveBeenCalledOnceWith(
            handTracking,
            "cerebra-ui",
        );
        expect(fixture.nativeElement.textContent).toContain(
            "Camera restarting",
        );

        action.next();
        action.complete();
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).not.toContain(
            "Camera restarting",
        );
        expect(rosService.listModels).toHaveBeenCalledTimes(2);
    });

    it("stops a model from its switch", () => {
        rosService.stopModel.and.returnValue(of(undefined));

        component.setModelActive({...handTracking, active: true}, false);

        expect(rosService.stopModel).toHaveBeenCalledOnceWith(
            "hand_tracking",
            "cerebra-ui",
        );
    });

    it("allows different models to start independently", () => {
        const actions = new Subject<void>();
        rosService.startModel.and.returnValue(actions);

        component.setModelActive(handTracking, true);
        component.setModelActive(objectDetection, true);

        expect(rosService.startModel).toHaveBeenCalledTimes(2);
        expect(component.actionsInFlight).toEqual(
            new Set(["hand_tracking", "object_detection"]),
        );
    });

    it("clears a status snapshot when updates stop", fakeAsync(() => {
        status$.next({
            models: [
                {
                    model_id: "hand_tracking",
                    state: "running",
                    fps: 20,
                    active: true,
                },
            ],
        });
        expect(component.statuses.size).toBe(1);

        tick(2500);

        expect(component.statuses.size).toBe(0);
    }));
});
