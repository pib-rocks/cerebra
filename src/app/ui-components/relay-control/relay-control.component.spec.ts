import {ComponentFixture, TestBed} from "@angular/core/testing";

import {RelayControlComponent} from "./relay-control.component";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {BehaviorSubject, of, throwError} from "rxjs";
import {SolidStateRelayState} from "src/app/shared/ros-types/msg/solid-state-relay-state";
import {Bricklet} from "src/app/shared/types/bricklet";

describe("RelayControlComponent", () => {
    let component: RelayControlComponent;
    let fixture: ComponentFixture<RelayControlComponent>;
    let rosServiceMock: jasmine.SpyObj<RosService>;
    let brickletServiceMock: jasmine.SpyObj<BrickletService>;
    let matSnackBarServiceMock: jasmine.SpyObj<MatSnackBar>;
    let relayState$: BehaviorSubject<SolidStateRelayState | undefined>;
    let bricklets$: BehaviorSubject<Bricklet[]>;

    beforeEach(async () => {
        relayState$ = new BehaviorSubject<SolidStateRelayState | undefined>(
            undefined,
        );
        bricklets$ = new BehaviorSubject<Bricklet[]>([]);

        rosServiceMock = jasmine.createSpyObj(
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

        await TestBed.configureTestingModule({
            imports: [RelayControlComponent],
            providers: [
                {provide: RosService, useValue: rosServiceMock},
                {provide: BrickletService, useValue: brickletServiceMock},
                {provide: MatSnackBar, useValue: matSnackBarServiceMock},
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
    });

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
