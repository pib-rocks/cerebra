import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {BehaviorSubject, Subject, of} from "rxjs";
import {
    ModelState,
    ModelStatus,
    ModelStatusArray,
} from "../../shared/ros-types/msg/model-status";
import {
    ListModelsResponse,
    ModelInfo,
} from "../../shared/ros-types/srv/list-models";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {ModelListComponent} from "./model-list.component";

describe("ModelListComponent", () => {
    let component: ModelListComponent;
    let fixture: ComponentFixture<ModelListComponent>;
    let rosService: jasmine.SpyObj<RosService>;
    let status$: BehaviorSubject<ModelStatusArray>;
    let connection$: BehaviorSubject<boolean>;

    const handTracking: ModelInfo = {
        model_id: "hand_tracking",
        task: "hand tracking",
        licence: "Apache-2.0",
        shaves: 4,
        size_bytes: 10485760,
        available: true,
        active: false,
    };
    const objectDetection: ModelInfo = {
        ...handTracking,
        model_id: "object_detection",
        task: "object detection",
        shaves: 6,
    };

    beforeEach(async () => {
        status$ = new BehaviorSubject<ModelStatusArray>({models: []});
        connection$ = new BehaviorSubject(true);
        rosService = jasmine.createSpyObj<RosService>(
            "RosService",
            ["listModels", "startModel", "stopModel"],
            {
                modelStatusReceiver$: status$,
                connectionStatus$: connection$,
            },
        );
        rosService.listModels.and.returnValue(
            of({models: [handTracking], total_shaves: 0}),
        );

        await TestBed.configureTestingModule({
            imports: [ModelListComponent],
            providers: [{provide: RosService, useValue: rosService}],
        }).compileComponents();

        fixture = TestBed.createComponent(ModelListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    function named(modelId: string, shaves: number, task = modelId): ModelInfo {
        return {
            model_id: modelId,
            task,
            licence: "Apache-2.0",
            shaves,
            size_bytes: 100,
            available: true,
            active: false,
        };
    }

    function modelStatus(
        modelId: string,
        state: ModelState,
        active: boolean,
        fps = 0,
    ): ModelStatus {
        return {model_id: modelId, state, fps, active};
    }

    function showModels(models: ModelInfo[], totalShaves?: number): void {
        const response =
            totalShaves === undefined
                ? ({models} as ListModelsResponse)
                : {models, total_shaves: totalShaves};
        rosService.listModels.and.returnValue(of(response));
        connection$.next(false);
        connection$.next(true);
        fixture.detectChanges();
    }

    function labels(): string[] {
        return [
            ...fixture.nativeElement.querySelectorAll(".model-copy label"),
        ].map((label: HTMLElement) => label.textContent?.trim() ?? "");
    }

    function slotLines(): string[] {
        return [...fixture.nativeElement.querySelectorAll(".model-id")].map(
            (line: HTMLElement) => line.textContent?.trim() ?? "",
        );
    }

    function freeSlotsLabel(): string | null {
        return (
            fixture.nativeElement
                .querySelector(".free-slots")
                ?.textContent?.trim() ?? null
        );
    }

    function toggle(modelId: string): HTMLInputElement {
        const input = fixture.nativeElement.querySelector(
            `[data-model-id="${modelId}"] input[type="checkbox"]`,
        );
        expect(input).withContext(`toggle for ${modelId}`).not.toBeNull();
        return input;
    }

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

    it("lists the six readable names in order and keeps an unknown model after them", () => {
        const unknown = named("custom_classifier", 5, "custom task");
        // Manifest order, deliberately not the display order. The unknown model
        // is first so a missing sort would leave it there.
        showModels(
            [
                unknown,
                named("hand_tracking_fast", 3, "hands"),
                named("face_detection_yunet_160x120", 4, "detect faces"),
                named("emotion_recognition_crop", 2, "emotion"),
                named("head_pose_estimation_crop", 2, "pose"),
                named("yolov6n_coco_640x640", 6, "coco"),
                named("qr_code_detection_384x384", 1, "qr"),
            ],
            16,
        );

        expect(labels()).toEqual([
            "Face detection",
            "Object detection",
            "Hand tracking",
            "Emotion recognition",
            "Head pose estimation",
            "QR-Code detection",
            "custom task",
        ]);
        expect(fixture.nativeElement.textContent).not.toContain("detect faces");
        expect(slotLines()).toEqual([
            "face_detection_yunet_160x120 (4 Slots)",
            "yolov6n_coco_640x640 (6 Slots)",
            "hand_tracking_fast (3 Slots)",
            "emotion_recognition_crop (2 Slots)",
            "head_pose_estimation_crop (2 Slots)",
            "qr_code_detection_384x384 (1 Slots)",
            "custom_classifier (5 Slots)",
        ]);
    });

    it("shows free slots for zero, one and two running models", () => {
        const face = named("face_detection_yunet_160x120", 4);
        const objects = named("yolov6n_coco_640x640", 6);
        showModels([objects, face], 16);

        expect(freeSlotsLabel()).toBe("Free slots: 16");

        status$.next({
            models: [modelStatus(face.model_id, "running", true, 12)],
        });
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 12");

        status$.next({
            models: [
                modelStatus(face.model_id, "running", true, 12),
                modelStatus(objects.model_id, "running", true, 8),
            ],
        });
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 6");
    });

    it("hides free slots and does not refuse a start when the total is unknown", () => {
        const heavy = named("yolov6n_coco_640x640", 20);
        showModels([heavy], 0);

        expect(freeSlotsLabel()).toBeNull();
        expect(toggle(heavy.model_id).disabled).toBeFalse();

        showModels([heavy]);
        expect(freeSlotsLabel()).toBeNull();
        expect(toggle(heavy.model_id).disabled).toBeFalse();
    });

    it("disables a start that does not fit and still allows switching a running model off", () => {
        const running = named("face_detection_yunet_160x120", 6);
        running.active = true;
        const tooBig = named("yolov6n_coco_640x640", 6);
        const fits = named("hand_tracking_fast", 4);
        const unavailable = named("qr_code_detection_384x384", 1);
        unavailable.available = false;
        showModels([running, tooBig, fits, unavailable], 10);
        status$.next({
            models: [modelStatus(running.model_id, "running", true, 10)],
        });
        fixture.detectChanges();

        expect(freeSlotsLabel()).toBe("Free slots: 4");
        expect(toggle(tooBig.model_id).disabled).toBeTrue();
        expect(toggle(tooBig.model_id).title).toBe(
            "Not enough free slots (needs 6, 4 free)",
        );
        expect(toggle(tooBig.model_id).getAttribute("aria-label")).toBe(
            "Not enough free slots (needs 6, 4 free)",
        );
        expect(toggle(fits.model_id).disabled).toBeFalse();
        expect(toggle(fits.model_id).getAttribute("aria-label")).toBe(
            "Run Hand tracking",
        );
        expect(toggle(running.model_id).disabled).toBeFalse();
        expect(toggle(unavailable.model_id).disabled).toBeTrue();
        expect(toggle(unavailable.model_id).hasAttribute("title")).toBeFalse();

        rosService.stopModel.and.returnValue(of(undefined));
        component.setModelActive(running, false);
        expect(rosService.stopModel).toHaveBeenCalledOnceWith(
            running.model_id,
            "cerebra-ui",
        );
    });

    it("reserves slots from the moment a start is requested and does not count them twice", () => {
        const face = named("face_detection_yunet_160x120", 4);
        showModels([face], 16);
        const action = new Subject<void>();
        rosService.startModel.and.returnValue(action);

        component.setModelActive(face, true);
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 12");
        expect(fixture.nativeElement.textContent).toContain(
            "Camera restarting",
        );

        status$.next({
            models: [modelStatus(face.model_id, "running", true, 18)],
        });
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 12");
    });

    it("releases the reservation when a start fails", () => {
        const started = named("face_detection_yunet_160x120", 6);
        const other = named("yolov6n_coco_640x640", 6);
        showModels([started, other], 10);
        const action = new Subject<void>();
        rosService.startModel.and.returnValue(action);

        component.setModelActive(started, true);
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 4");
        expect(toggle(other.model_id).disabled).toBeTrue();

        status$.next({
            models: [modelStatus(started.model_id, "failed", false)],
        });
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 10");
        expect(toggle(other.model_id).disabled).toBeFalse();

        status$.next({models: []});
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 10");

        action.next();
        action.complete();
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 10");
        expect(toggle(started.model_id).disabled).toBeFalse();
    });

    it("releases the reservation when the start request errors", () => {
        const started = named("face_detection_yunet_160x120", 6);
        const other = named("yolov6n_coco_640x640", 6);
        showModels([started, other], 10);
        const action = new Subject<void>();
        rosService.startModel.and.returnValue(action);

        component.setModelActive(started, true);
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 4");

        action.error(new Error("pipeline failed"));
        fixture.detectChanges();
        expect(freeSlotsLabel()).toBe("Free slots: 10");
        expect(toggle(other.model_id).disabled).toBeFalse();
        expect(toggle(started.model_id).disabled).toBeFalse();
    });
});
