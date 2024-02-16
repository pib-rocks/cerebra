import {Injectable} from "@angular/core";
import {RosService} from "./ros-service/ros.service";
import {ApiService} from "./api.service";
import {BehaviorSubject, Observable, map} from "rxjs";
import {MotorSettings} from "../types/motor-settings.class";
import {JointTrajectoryMessage} from "../ros-types/msg/joint-trajectory-message";
import {DiagnosticStatus} from "../ros-types/msg/diagnostic-status.message";
import {MotorSettingsMessage} from "../ros-types/msg/motor-settings-message";
import {UrlConstants} from "./url.constants";
import {MotorDTO} from "../types/motor-dto";
import {MotorSettingsError} from "../error/motor-settings-error";

@Injectable({
    providedIn: "root",
})
export class MotorService {
    private readonly defaultSettings: MotorSettings = {
        velocity: 0,
        acceleration: 0,
        deceleration: 0,
        period: 0,
        pulseWidthMin: 0,
        pulseWidthMax: 0,
        rotationRangeMin: -90,
        rotationRangeMax: +90,
        turnedOn: true,
        visible: false,
        invert: false,
    };
    private readonly defaultPosition: number = 0;
    private readonly defaultCurrent: number = 0;

    private motorNameToSettingsSubject: Map<
        string,
        BehaviorSubject<MotorSettings>
    > = new Map();
    private motorNameToPositionSubject: Map<string, BehaviorSubject<number>> =
        new Map();
    private motorNameToCurrentSubject: Map<string, BehaviorSubject<number>> =
        new Map();

    private publishToSubject<T>(
        motorName: string,
        motorNameToSubject: Map<string, BehaviorSubject<T>>,
        value?: T,
    ) {
        const subject = motorNameToSubject.get(motorName);
        if (subject) subject.next(value ?? subject.value);
        else if (value)
            motorNameToSubject.set(motorName, new BehaviorSubject(value as T));
    }

    private getObservable<T>(
        motorName: string,
        motorNameToSubject: Map<string, BehaviorSubject<T>>,
        defaultValue: T,
    ): Observable<T> {
        let subject = motorNameToSubject.get(motorName);
        if (!subject) {
            subject = new BehaviorSubject(defaultValue);
            motorNameToSubject.set(motorName, subject);
        }
        return subject;
    }

    constructor(
        private rosService: RosService,
        private apiService: ApiService,
    ) {
        this.rosService.motorSettingsReceiver$.subscribe(
            (msg: MotorSettingsMessage) => {
                const motorName: string = msg.motor_name;
                const settings: MotorSettings = {
                    velocity: msg.velocity,
                    acceleration: msg.acceleration,
                    deceleration: msg.deceleration,
                    period: msg.period,
                    pulseWidthMin: msg.pulse_width_min,
                    pulseWidthMax: msg.pulse_width_max,
                    rotationRangeMin: Math.floor(msg.rotation_range_min / 100),
                    rotationRangeMax: Math.floor(msg.rotation_range_max / 100),
                    turnedOn: msg.turned_on,
                    visible: msg.visible,
                    invert: msg.invert,
                };
                this.publishToSubject(
                    motorName,
                    this.motorNameToSettingsSubject,
                    settings,
                );
            },
        );

        this.apiService
            .get(UrlConstants.MOTOR)
            .subscribe((dto: {motors: MotorDTO[]}) => {
                dto.motors.forEach((motor) => {
                    const motorName: string = motor.name;
                    const settings: MotorSettings = {
                        velocity: motor.velocity,
                        acceleration: motor.acceleration,
                        deceleration: motor.deceleration,
                        period: motor.period,
                        pulseWidthMin: motor.pulseWidthMin,
                        pulseWidthMax: motor.pulseWidthMax,
                        rotationRangeMin: Math.floor(
                            motor.rotationRangeMin / 100,
                        ),
                        rotationRangeMax: Math.floor(
                            motor.rotationRangeMax / 100,
                        ),
                        turnedOn: motor.turnedOn,
                        visible: motor.visible,
                        invert: motor.invert,
                    };
                    this.publishToSubject(
                        motorName,
                        this.motorNameToSettingsSubject,
                        settings,
                    );
                });
            });

        this.rosService.jointTrajectoryReceiver$.subscribe(
            (jt: JointTrajectoryMessage) => {
                const motorName: string = jt.joint_names[0];
                const position: number = Math.floor(
                    jt.points[0].positions[0] / 100,
                );
                // TODO: conversion between multi-motor and simple-motors should be handled
                // in the backend/motor-control-node
                let motorNames: string[];
                if (motorName == "all_fingers_left") {
                    motorNames = [
                        "thumb_left_stretch",
                        "index_left_stretch",
                        "middle_left_stretch",
                        "ring_left_stretch",
                        "pinky_left_stretch",
                    ];
                } else if (motorName == "all_fingers_right") {
                    motorNames = [
                        "thumb_right_stretch",
                        "index_right_stretch",
                        "middle_right_stretch",
                        "ring_right_stretch",
                        "pinky_right_stretch",
                    ];
                } else {
                    motorNames = [motorName];
                }
                for (let motorName of motorNames) {
                    this.publishToSubject(
                        motorName,
                        this.motorNameToPositionSubject,
                        position,
                    );
                }
            },
        );

        this.rosService.currentReceiver$.subscribe(
            (status: DiagnosticStatus) => {
                const motorName: string = status.name;
                const current: number = Number(status.values[0].value);
                this.publishToSubject(
                    motorName,
                    this.motorNameToCurrentSubject,
                    current,
                );
            },
        );
    }

    getSettingsObservable(motorName: string): Observable<MotorSettings> {
        return this.getObservable(
            motorName,
            this.motorNameToSettingsSubject,
            this.defaultSettings,
        ).pipe(map((settings) => structuredClone(settings)));
    }

    getPositionObservable(motorName: string): Observable<number> {
        return this.getObservable(
            motorName,
            this.motorNameToPositionSubject,
            this.defaultPosition,
        );
    }

    getCurrentObservable(motorName: string): Observable<number> {
        return this.getObservable(
            motorName,
            this.motorNameToCurrentSubject,
            this.defaultCurrent,
        );
    }

    applySettings(motorName: string, settings: MotorSettings): void {
        this.rosService
            .sendMotorSettingsMessage({
                motor_name: motorName,
                turned_on: settings.turnedOn,
                pulse_width_min: settings.pulseWidthMin,
                pulse_width_max: settings.pulseWidthMax,
                rotation_range_min: settings.rotationRangeMin * 100,
                rotation_range_max: settings.rotationRangeMax * 100,
                velocity: settings.velocity,
                acceleration: settings.acceleration,
                deceleration: settings.deceleration,
                period: settings.period,
                visible: settings.visible,
                invert: settings.invert,
            })
            .subscribe({
                error: (error) => {
                    if (
                        error instanceof MotorSettingsError &&
                        error.settingsApplied
                    )
                        return;
                    this.publishToSubject(
                        motorName,
                        this.motorNameToSettingsSubject,
                    );
                    throw error;
                },
            });
    }

    setPosition(motorName: string, position: number): void {
        this.rosService.sendJointTrajectoryMessage({
            header: {
                stamp: {
                    sec: 0,
                    nanosec: 0,
                },
                frame_id: "",
            },
            joint_names: [motorName],
            points: [
                {
                    positions: [position * 100],
                    time_from_start: {sec: 0, nanosec: 0},
                },
            ],
        });
    }
}
