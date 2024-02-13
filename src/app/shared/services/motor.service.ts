import {Injectable} from "@angular/core";
import {RosService} from "./ros-service/ros.service";
import {ApiService} from "./api.service";
import {BehaviorSubject, Observable, Subject, map, merge} from "rxjs";
import {MotorSettings} from "../types/motor-settings.class";
import {JointTrajectoryMessage} from "../ros-message-types/jointTrajectoryMessage";
import {DiagnosticStatus} from "../ros-message-types/DiagnosticStatus.message";
import {MotorSettingsMessage} from "../ros-message-types/motorSettingsMessage";
import {UrlConstants} from "./url.constants";
import {MotorDTO} from "../types/motor-dto";
import {MotorSettingsError} from "../error/motor-settings-error";

@Injectable({
    providedIn: "root",
})
export class MotorService {
    readonly defaultSettings: MotorSettings = {
        velocity: 0,
        acceleration: 0,
        deceleration: 0,
        period: 0,
        pulseWidthMin: 0,
        pulseWidthMax: 0,
        rotationRangeMin: 0,
        rotationRangeMax: 0,
        turnedOn: true,
        visible: false,
    };
    readonly defaultPosition: number = 0;
    readonly defaultCurrent: number = 0;

    motorNameToSettingsSubject: Map<string, BehaviorSubject<MotorSettings>> =
        new Map();
    motorNameToPositionSubject: Map<string, BehaviorSubject<number>> =
        new Map();
    motorNameToCurrentSubject: Map<string, BehaviorSubject<number>> = new Map();

    private publishToSubject<T>(
        motorName: string,
        motorNameToSubject: Map<string, BehaviorSubject<T>>,
        value?: T,
    ) {
        let subject = motorNameToSubject.get(motorName);
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
                this.publishToSubject(
                    motorName,
                    this.motorNameToPositionSubject,
                    position,
                );
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

    getSettingObservable(motorName: string): Observable<MotorSettings> {
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
