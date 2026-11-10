import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from "@angular/core/testing";

import {RelayControlComponent} from "./relay-control.component";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {BehaviorSubject, of, Subject, throwError} from "rxjs";
import {SolidStateRelayState} from "src/app/shared/ros-types/msg/solid-state-relay-state";
import {Bricklet} from "src/app/shared/types/bricklet";
import {createServiceSpy} from "src/app/shared/testing/create-service-spy";
import {PoseService} from "src/app/shared/services/pose.service";
import {MotorService} from "src/app/shared/services/motor.service";
import {Pose} from "src/app/shared/types/pose";
import {MotorPosition} from "src/app/shared/types/motor-position";
import {PoseTransfer} from "src/app/shared/types/pose-transfer";

describe("RelayControlComponent", () => {
    let component: RelayControlComponent;
    let fixture: ComponentFixture<RelayControlComponent>;
    let rosServiceMock: jasmine.SpyObj<RosService>;
    let brickletServiceMock: jasmine.SpyObj<BrickletService>;
    let matSnackBarServiceMock: jasmine.SpyObj<MatSnackBar>;
    let poseServiceMock: jasmine.SpyObj<PoseService>;
    let motorServiceMock: jasmine.SpyObj<MotorService>;
    let relayState$: BehaviorSubject<SolidStateRelayState | undefined>;
    let bricklets$: BehaviorSubject<Bricklet[]>;
    let poses$: BehaviorSubject<Pose[]>;

    beforeEach(async () => {
        relayState$ = new BehaviorSubject<SolidStateRelayState | undefined>(
            undefined,
        );
        bricklets$ = new BehaviorSubject<Bricklet[]>([]);

        rosServiceMock = createServiceSpy<RosService>(
            "RosService",
            ["setSolidStateRelayState"],
            {
                solidStateRelayStateReceiver$: relayState$,
            },
        );

        brickletServiceMock = jasmine.createSpyObj("BrickletService", [
            "getBrickletObservable",
        ]);
        brickletServiceMock.getBrickletObservable.and.returnValue(bricklets$);

        matSnackBarServiceMock = jasmine.createSpyObj("MatSnackBar", ["open"]);

        poses$ = new BehaviorSubject<Pose[]>([]);
        poseServiceMock = jasmine.createSpyObj("PoseService", [
            "getPosesObservable",
            "exportPose",
        ]);
        poseServiceMock.getPosesObservable.and.returnValue(poses$);

        motorServiceMock = jasmine.createSpyObj("MotorService", [
            "setPositions",
        ]);

        await TestBed.configureTestingModule({
            imports: [RelayControlComponent],
            providers: [
                {provide: RosService, useValue: rosServiceMock},
                {provide: BrickletService, useValue: brickletServiceMock},
                {provide: MatSnackBar, useValue: matSnackBarServiceMock},
                {provide: PoseService, useValue: poseServiceMock},
                {provide: MotorService, useValue: motorServiceMock},
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RelayControlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.isRelayAvailable = true;
        component.turnedOn = false;
        component.isLoading = false;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should set isRelayAvailable to true when relay bricklet hardware ID is configured", () => {
        const relayBricklet = new Bricklet(
            "XYZ123",
            1,
            "Solid State Relay Bricklet",
        );
        bricklets$.next([relayBricklet]);

        expect(component.isRelayAvailable).toBeTrue();
    });

    it("should keep isRelayAvailable false if relay bricklet UID is empty and no ROS state", () => {
        const unconfiguredRelay = new Bricklet(
            "",
            1,
            "Solid State Relay Bricklet",
        );
        bricklets$.next([unconfiguredRelay]);
        relayState$.next(undefined);

        expect(component.isRelayAvailable).toBeFalse();
    });

    it("should set isRelayAvailable and turnedOn when ROS state is received", () => {
        relayState$.next({turned_on: true});

        expect(component.isRelayAvailable).toBeTrue();
        expect(component.turnedOn).toBeTrue();

        relayState$.next(undefined);

        expect(component.isRelayAvailable).toBeFalse();
    });

    it("should keep isRelayAvailable true when ROS state is undefined but hardware ID is configured", () => {
        const relayBricklet = new Bricklet(
            "XYZ123",
            1,
            "Solid State Relay Bricklet",
        );
        bricklets$.next([relayBricklet]);
        relayState$.next(undefined);

        expect(component.isRelayAvailable).toBeTrue();
    });

    it("should toggle SSR state and send request when relay is available", () => {
        rosServiceMock.setSolidStateRelayState.and.returnValue(of(void 0));

        component.toggleSolidStateRelay();

        expect(component.isLoading).toBeFalse();
        expect(component.turnedOn).toBeTrue();
        expect(rosServiceMock.setSolidStateRelayState).toHaveBeenCalledWith({
            turned_on: true,
        });
        expect(poseServiceMock.getPosesObservable).not.toHaveBeenCalled();
    });

    it("should turn SSR on immediately without consulting poses", () => {
        rosServiceMock.setSolidStateRelayState.and.returnValue(of(void 0));

        component.toggleSolidStateRelay();

        expect(motorServiceMock.setPositions).not.toHaveBeenCalled();
        expect(rosServiceMock.setSolidStateRelayState).toHaveBeenCalledWith({
            turned_on: true,
        });
    });

    it("should move to Startup/Resting before turning SSR off", fakeAsync(() => {
        const restingMotorPositions: MotorPosition[] = [
            {motorName: "joint_1", position: 0},
        ];
        const restingPose = new Pose("Startup/Resting", "pose-rest", false);
        poses$.next([restingPose]);
        poseServiceMock.exportPose.and.returnValue(
            of({
                name: restingPose.name,
                motorPositions: restingMotorPositions,
            } satisfies PoseTransfer),
        );
        motorServiceMock.setPositions.and.returnValue(of(void 0));
        rosServiceMock.setSolidStateRelayState.and.returnValue(of(void 0));

        component.turnedOn = true;
        component.restBeforeOffDelayMs = 100;
        component.toggleSolidStateRelay();

        expect(rosServiceMock.setSolidStateRelayState).not.toHaveBeenCalled();
        expect(poseServiceMock.exportPose).toHaveBeenCalledWith("pose-rest");
        expect(motorServiceMock.setPositions).toHaveBeenCalledWith(
            restingMotorPositions,
        );

        tick(100);

        expect(rosServiceMock.setSolidStateRelayState).toHaveBeenCalledWith({
            turned_on: false,
        });
    }));

    it("should still turn SSR off when Startup/Resting pose lookup fails", fakeAsync(() => {
        poses$.next([]);
        rosServiceMock.setSolidStateRelayState.and.returnValue(of(void 0));

        component.turnedOn = true;
        component.toggleSolidStateRelay();

        tick();

        expect(motorServiceMock.setPositions).not.toHaveBeenCalled();
        expect(rosServiceMock.setSolidStateRelayState).toHaveBeenCalledWith({
            turned_on: false,
        });
    }));

    it("should release the toggle when the relay state arrives instead of the service response", () => {
        rosServiceMock.setSolidStateRelayState.and.returnValue(
            new Subject<void>().asObservable(),
        );

        component.toggleSolidStateRelay();
        expect(component.isLoading).toBeTrue();

        // The node broadcasts the state it applied. rosbridge can lose the service response, which
        // used to leave the button disabled until the page was reloaded.
        relayState$.next({turned_on: true});

        expect(component.isLoading).toBeFalse();
        expect(component.turnedOn).toBeTrue();
    });

    it("should release the toggle after the deadline when nothing acknowledges", fakeAsync(() => {
        rosServiceMock.setSolidStateRelayState.and.returnValue(
            new Subject<void>().asObservable(),
        );

        component.toggleSolidStateRelay();
        expect(component.isLoading).toBeTrue();

        tick(5000);

        expect(component.isLoading).toBeFalse();
    }));

    it("should not toggle SSR if relay is not available", () => {
        component.isRelayAvailable = false;

        component.toggleSolidStateRelay();

        expect(rosServiceMock.setSolidStateRelayState).not.toHaveBeenCalled();
    });

    it("should handle error and revert turnedOn", () => {
        rosServiceMock.setSolidStateRelayState.and.returnValue(
            throwError(() => new Error("Test error")),
        );

        component.toggleSolidStateRelay();

        expect(component.turnedOn).toBeFalse();
        expect(matSnackBarServiceMock.open).toHaveBeenCalledWith(
            "Error! SSR could not be set.",
            "",
            {
                panelClass: "cerebra-toast",
                duration: 3000,
            },
        );
    });

    it("should ignore toggle if loadingSSR is true", () => {
        component.isLoading = true;

        component.toggleSolidStateRelay();

        expect(rosServiceMock.setSolidStateRelayState).not.toHaveBeenCalled();
    });
});
