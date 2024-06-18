import {TestBed} from "@angular/core/testing";

import {MotorService} from "./motor.service";
import {ApiService} from "./api.service";
import {RosService} from "./ros-service/ros.service";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {MotorDTO} from "../types/motor-dto";
import {MotorSettings} from "../types/motor-settings.class";
import {MotorSettingsMessage} from "../ros-types/msg/motor-settings-message";
import {MotorPosition} from "../types/motor-position";

describe("MotorService", () => {
    let service: MotorService;
    let apiService: jasmine.SpyObj<ApiService>;
    let rosService: jasmine.SpyObj<RosService>;

    const testMotor: MotorDTO = {
        brickletPins: [],
        name: "test-motor",
        turnedOn: false,
        pulseWidthMin: 1,
        pulseWidthMax: 2,
        rotationRangeMin: 3,
        rotationRangeMax: 4,
        velocity: 5,
        acceleration: 6,
        deceleration: 7,
        period: 8,
        visible: true,
        invert: false,
    };

    beforeEach(() => {
        const rosServiceSpy: jasmine.SpyObj<RosService> = jasmine.createSpyObj(
            "RosService",
            ["applyMotorSettings", "applyJointTrajectory"],
            {
                motorSettingsReceiver$: new Subject(),
                jointTrajectoryReceiver$: new Subject(),
                currentReceiver$: new Subject(),
            },
        );
        const apiServiceSpy: jasmine.SpyObj<ApiService> = jasmine.createSpyObj(
            "ApiService",
            ["get", "delete", "put", "post"],
        );

        apiServiceSpy.get.and.returnValue(
            new BehaviorSubject({motors: [testMotor]}),
        );
        TestBed.configureTestingModule({
            providers: [
                MotorService,
                {
                    provide: RosService,
                    useValue: rosServiceSpy,
                },
                {
                    provide: ApiService,
                    useValue: apiServiceSpy,
                },
            ],
        });

        service = TestBed.inject(MotorService);
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        rosService = TestBed.inject(RosService) as jasmine.SpyObj<RosService>;
        apiService.get = jasmine.createSpy();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should publish to an existing subject, if it already exists", () => {
        const settings: MotorSettings = {
            velocity: 0,
            acceleration: 1,
            deceleration: 0,
            period: 1,
            pulseWidthMin: 0,
            pulseWidthMax: 1,
            rotationRangeMin: 0,
            rotationRangeMax: 1,
            turnedOn: false,
            visible: true,
            invert: false,
        };
        const subject = jasmine.createSpyObj("subject-spy", ["next"]);
        subject.value = settings;
        const motorNameToSettingsSubject = new Map().set(
            "new-motor-name",
            subject,
        );
        service["publishToSubject"](
            "new-motor-name",
            motorNameToSettingsSubject,
        );
        expect(subject.next).toHaveBeenCalledOnceWith(settings);
    });

    it("should re-publish to an existing subject, if it already exists", () => {
        const settings: MotorSettings = {
            velocity: 0,
            acceleration: 1,
            deceleration: 0,
            period: 1,
            pulseWidthMin: 0,
            pulseWidthMax: 1,
            rotationRangeMin: 0,
            rotationRangeMax: 1,
            turnedOn: false,
            visible: true,
            invert: false,
        };
        const subject = jasmine.createSpyObj("subject-spy", ["next"]);
        const motorNameToSettingsSubject = new Map().set(
            "new-motor-name",
            subject,
        );
        service["publishToSubject"](
            "new-motor-name",
            motorNameToSettingsSubject,
            settings,
        );
        expect(subject.next).toHaveBeenCalledOnceWith(settings);
    });

    it("should create a new subject, if there is not one available", () => {
        const settings: MotorSettings = {
            velocity: 0,
            acceleration: 1,
            deceleration: 0,
            period: 1,
            pulseWidthMin: 0,
            pulseWidthMax: 1,
            rotationRangeMin: 0,
            rotationRangeMax: 1,
            turnedOn: false,
            visible: true,
            invert: false,
        };
        const motorNameToSettingsSubject = new Map();
        service["publishToSubject"](
            "new-motor-name",
            motorNameToSettingsSubject,
            settings,
        );
        const subject = motorNameToSettingsSubject.get("new-motor-name");
        expect(subject).toEqual(jasmine.any(BehaviorSubject));
        expect(subject.value).toEqual(settings);
    });

    it("should not create a new subject, if no value is specified", () => {
        const motorNameToSettingsSubject = jasmine.createSpyObj("map", [
            "get",
            "set",
        ]);
        motorNameToSettingsSubject.get.and.returnValue(undefined);
        expect(motorNameToSettingsSubject.set).not.toHaveBeenCalled();
    });

    it("should get an existing observable", () => {
        const subject = new BehaviorSubject(0);
        const motorNameToSettingsSubject = new Map().set(
            "new-motor-name",
            subject,
        );
        expect(
            service["getObservable"](
                "new-motor-name",
                motorNameToSettingsSubject,
                -1,
            ),
        ).toBe(subject);
    });

    it("should return a newly created subject with the specified default value", () => {
        const motorNameToSettingsSubject = new Map();
        const subject = service["getObservable"](
            "new-motor-name",
            motorNameToSettingsSubject,
            -1,
        );
        expect(subject).toEqual(jasmine.any(BehaviorSubject));
        expect((subject as BehaviorSubject<number>).value).toBe(-1);
    });

    it("should get the initial motors from the pib-api", () => {
        const subject = service["motorNameToSettingsSubject"].get("test-motor");
        expect((subject as BehaviorSubject<MotorSettings>).value).toEqual(
            jasmine.objectContaining({
                turnedOn: false,
                pulseWidthMin: 1,
                pulseWidthMax: 2,
                rotationRangeMin: 3,
                rotationRangeMax: 4,
                velocity: 5,
                acceleration: 6,
                deceleration: 7,
                period: 8,
                visible: true,
                invert: false,
            }),
        );
    });

    it("should get settings values from ros", () => {
        const settings: MotorSettings = {
            velocity: 0,
            acceleration: 1,
            deceleration: 2,
            period: 3,
            pulseWidthMin: 4,
            pulseWidthMax: 5,
            rotationRangeMin: 6,
            rotationRangeMax: 7,
            turnedOn: false,
            visible: false,
            invert: false,
        };
        const setttingsMessage: MotorSettingsMessage = {
            motor_name: "test-motor",
            velocity: 0,
            acceleration: 1,
            deceleration: 2,
            period: 3,
            pulse_width_min: 4,
            pulse_width_max: 5,
            rotation_range_min: 6,
            rotation_range_max: 7,
            turned_on: false,
            visible: false,
            invert: false,
        };
        const publishToSubjectSpy = spyOn<any>(service, "publishToSubject");
        rosService.motorSettingsReceiver$.next(setttingsMessage);
        expect(publishToSubjectSpy).toHaveBeenCalledOnceWith(
            "test-motor",
            service["motorNameToSettingsSubject"],
            jasmine.objectContaining(settings),
        );
    });

    it("should get position values from ros", () => {
        const publishToSubjectSpy = spyOn<any>(service, "publishToSubject");
        rosService.jointTrajectoryReceiver$.next({
            header: {
                stamp: {
                    sec: 0,
                    nanosec: 0,
                },
                frame_id: "",
            },
            joint_names: ["test-motor"],
            points: [
                {
                    positions: [77],
                    time_from_start: {sec: 0, nanosec: 0},
                },
            ],
        });
        expect(publishToSubjectSpy).toHaveBeenCalledOnceWith(
            "test-motor",
            service["motorNameToPositionSubject"],
            77,
        );
    });

    it("should get current values from ros", () => {
        const publishToSubjectSpy = spyOn<any>(service, "publishToSubject");
        rosService.currentReceiver$.next({
            level: "arraybuffer",
            name: "test-motor",
            hardware_id: "",
            values: [{key: "test-motor", value: "27"}],
        });
        expect(publishToSubjectSpy).toHaveBeenCalledOnceWith(
            "test-motor",
            service["motorNameToCurrentSubject"],
            27,
        );
    });

    it("should get the settings-subject", () => {
        const observable = jasmine.createSpyObj("observable", ["pipe"]);
        const pipedObservable = new Observable();
        observable.pipe.and.returnValue(pipedObservable);
        const getObservableSpy = spyOn<any>(
            service,
            "getObservable",
        ).and.returnValue(observable);
        expect(service.getSettingsObservable("test-motor")).toBe(
            pipedObservable,
        );
        expect(getObservableSpy).toHaveBeenCalledOnceWith(
            "test-motor",
            service["motorNameToSettingsSubject"],
            service["defaultSettings"],
        );
    });

    it("should get the position-subject", () => {
        const observable = jasmine.createSpyObj("observable", ["pipe"]);
        const getObservableSpy = spyOn<any>(
            service,
            "getObservable",
        ).and.returnValue(observable);
        expect(service.getPositionObservable("test-motor")).toBe(observable);
        expect(getObservableSpy).toHaveBeenCalledOnceWith(
            "test-motor",
            service["motorNameToPositionSubject"],
            service["defaultPosition"],
        );
    });

    it("should get the curent-subject", () => {
        const observable = jasmine.createSpyObj("observable", ["pipe"]);
        const getObservableSpy = spyOn<any>(
            service,
            "getObservable",
        ).and.returnValue(observable);
        expect(service.getCurrentObservable("test-motor")).toBe(observable);
        expect(getObservableSpy).toHaveBeenCalledOnceWith(
            "test-motor",
            service["motorNameToCurrentSubject"],
            service["defaultCurrent"],
        );
    });

    it("should send a motor-settings-message via the ros-service", () => {
        const motorName = "test-motor";
        const settings: MotorSettings = {
            velocity: 0,
            acceleration: 1,
            deceleration: 2,
            period: 3,
            pulseWidthMin: 4,
            pulseWidthMax: 5,
            rotationRangeMin: 6,
            rotationRangeMax: 7,
            turnedOn: false,
            visible: false,
            invert: false,
        };
        const setttingsMessage: MotorSettingsMessage = {
            motor_name: motorName,
            velocity: 0,
            acceleration: 1,
            deceleration: 2,
            period: 3,
            pulse_width_min: 4,
            pulse_width_max: 5,
            rotation_range_min: 6,
            rotation_range_max: 7,
            turned_on: false,
            visible: false,
            invert: false,
        };
        rosService.applyMotorSettings.and.returnValue(new Observable());
        service.applySettings(motorName, settings);
        expect(rosService.applyMotorSettings).toHaveBeenCalledOnceWith(
            setttingsMessage,
        );
    });

    it("should send a joint-trajectory-message, when setting the position", () => {
        const motorName = "test-motor";
        const position = 37;
        service.setPosition(motorName, position);
        expect(rosService.applyJointTrajectory).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                joint_names: jasmine.arrayWithExactContents([motorName]),
                points: jasmine.arrayWithExactContents([
                    jasmine.objectContaining({
                        positions: jasmine.arrayContaining([37]),
                    }),
                ]),
            }),
        );
    });

    it("should a joint-trajectory-messages, when setting the positions", () => {
        const motorPositions: MotorPosition[] = [
            {motorName: "test-motor-1", position: 1000},
            {motorName: "test-motor-2", position: 2000},
        ];
        service.setPositions(motorPositions);
        expect(rosService.applyJointTrajectory).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                joint_names: jasmine.arrayWithExactContents([
                    motorPositions[0].motorName,
                    motorPositions[1].motorName,
                ]),
                points: jasmine.arrayWithExactContents([
                    jasmine.objectContaining({
                        positions: jasmine.arrayWithExactContents([1000]),
                    }),
                    jasmine.objectContaining({
                        positions: jasmine.arrayWithExactContents([2000]),
                    }),
                ]),
            }),
        );
    });
});
