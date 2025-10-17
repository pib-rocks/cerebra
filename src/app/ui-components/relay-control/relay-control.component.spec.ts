import {ComponentFixture, TestBed} from "@angular/core/testing";

import {RelayControlComponent} from "./relay-control.component";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {BehaviorSubject, of, throwError} from "rxjs";
import {SolidStateRelayState} from "src/app/shared/ros-types/msg/solid-state-relay-state";

describe("RelayControlComponent", () => {
    let component: RelayControlComponent;
    let fixture: ComponentFixture<RelayControlComponent>;
    let rosServiceMock: jasmine.SpyObj<RosService>;
    let matSnackBarServiceMock: jasmine.SpyObj<MatSnackBar>;
    let relayState$: BehaviorSubject<SolidStateRelayState | undefined>;

    beforeEach(async () => {
        relayState$ = new BehaviorSubject<SolidStateRelayState | undefined>(
            undefined,
        );

        rosServiceMock = jasmine.createSpyObj(
            "RosService",
            ["setSolidStateRelayState"],
            {
                solidStateRelayStateReceiver$: relayState$,
            },
        );

        matSnackBarServiceMock = jasmine.createSpyObj("MatSnackBar", ["open"]);

        await TestBed.configureTestingModule({
            declarations: [RelayControlComponent],
            providers: [
                {provide: RosService, useValue: rosServiceMock},
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

    it("should set isRelayAvailable and turnedOn when a state is received", () => {
        relayState$.next({turned_on: true});

        expect(component.isRelayAvailable).toBeTrue();
        expect(component.turnedOn).toBeTrue();

        relayState$.next(undefined);

        expect(component.isRelayAvailable).toBeFalse();
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
