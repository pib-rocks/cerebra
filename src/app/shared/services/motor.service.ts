import {Injectable} from "@angular/core";
import {RosService} from "./ros-service/ros.service";
import {ApiService} from "./api.service";
import {BehaviorSubject, Observable, map} from "rxjs";
import {
    MotorSettings,
    fromMotorDTO,
    fromMotorSettingsMessage,
} from "../types/motor-settings.class";
import {fromMotorPosition} from "../ros-types/msg/joint-trajectory-message";
import {DiagnosticStatus} from "../ros-types/msg/diagnostic-status.message";
import {
    MotorSettingsMessage,
    fromMotorSettings,
} from "../ros-types/msg/motor-settings-message";
import {UrlConstants} from "./url.constants";
import {MotorDTO} from "../types/motor-dto";
import {MotorSettingsError} from "../error/motor-settings-error";
import {MotorPosition, fromJointTrajectory} from "../types/motor-position";
import {motors} from "../types/motor-configuration";

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
        rotationRangeMin: -9000,
        rotationRangeMax: +9000,
        turnedOn: true,
        visible: false,
        invert: false,
    };
    private readonly defaultPosition: number = 0;
    private readonly defaultCurrent: number = 0;

    private currentMotorPositions: MotorPosition[] = motors
        .filter((motor) => motor.displaySettings)
        .map((motor) => ({
            motorname: motor.motorName,
            position: this.defaultPosition,
        }));

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
                const settings: MotorSettings = fromMotorSettingsMessage(msg);
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
                    const settings: MotorSettings = fromMotorDTO(motor);
                    this.publishToSubject(
                        motorName,
                        this.motorNameToSettingsSubject,
                        settings,
                    );
                });
            });

        this.rosService.jointTrajectoryReceiver$
            .pipe(map(fromJointTrajectory))
            .subscribe(({motorname, position}) => {
                this.setCurrentMotorPosition(motorname, position);
                // TODO: conversion between multi-motor and simple-motors should be handled
                // in the backend/motor-control-node
                let motorNames: string[];
                if (motorname == "all_fingers_left") {
                    motorNames = [
                        "thumb_left_stretch",
                        "index_left_stretch",
                        "middle_left_stretch",
                        "ring_left_stretch",
                        "pinky_left_stretch",
                    ];
                } else if (motorname == "all_fingers_right") {
                    motorNames = [
                        "thumb_right_stretch",
                        "index_right_stretch",
                        "middle_right_stretch",
                        "ring_right_stretch",
                        "pinky_right_stretch",
                    ];
                } else {
                    motorNames = [motorname];
                }
                for (const motorName of motorNames) {
                    this.publishToSubject(
                        motorName,
                        this.motorNameToPositionSubject,
                        position,
                    );
                }
            });

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
            .sendMotorSettingsMessage(fromMotorSettings(motorName, settings))
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

    getCurrentPositions(): MotorPosition[] {
        return this.currentMotorPositions;
    }

    setPosition(motorname: string, position: number): void {
        const message = fromMotorPosition(motorname, position);
        this.rosService.sendJointTrajectoryMessage(message);
    }

    private setCurrentMotorPosition(motorname: string, position: number): void {
        const motorPosition = this.currentMotorPositions.find(
            (mp) => mp.motorname === motorname,
        );
        if (motorPosition) {
            motorPosition.position = position;
        }
    }
}
