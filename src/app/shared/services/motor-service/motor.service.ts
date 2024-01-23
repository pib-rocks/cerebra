import {Injectable} from "@angular/core";
import {RosService} from "../ros-service/ros.service";
import {
    BehaviorSubject,
    Observable,
    catchError,
    from,
    map,
    throwError,
} from "rxjs";
import {Motor} from "../../types/motor.class";
import {Group} from "../../types/motor.enum";
import {MotorSettingsMessage} from "../../ros-message-types/motorSettingsMessage";
import {JointTrajectoryMessage} from "../../ros-message-types/jointTrajectoryMessage";
import {MotorSettings} from "../../types/motor-settings.class";
import {ApiService} from "../api.service";
import {UrlConstants} from "../url.constants";
import {MotorSettingsDTO} from "../../types/motor-dto";

@Injectable({
    providedIn: "root",
})
export class MotorService {
    leftFingers = [
        {name: "thumb_left_opposition", label: "Thumb opposition"},
        {name: "thumb_left_stretch", label: "Thumb"},
        {name: "index_left_stretch", label: "Index finger"},
        {name: "middle_left_stretch", label: "Middle finger"},
        {name: "ring_left_stretch", label: "Ring finger"},
        {name: "pinky_left_stretch", label: "Pinky finger"},
        {name: "all_fingers_left", label: "Open/Close all fingers"},
    ];
    rightFingers = [
        {name: "thumb_right_opposition", label: "Thumb opposition"},
        {name: "thumb_right_stretch", label: "Thumb"},
        {name: "index_right_stretch", label: "Index finger"},
        {name: "middle_right_stretch", label: "Middle finger"},
        {name: "ring_right_stretch", label: "Ring finger"},
        {name: "pinky_right_stretch", label: "Pinky finger"},
        {name: "all_fingers_right", label: "Open/Close all fingers"},
    ];
    leftArm = [
        {name: "upper_arm_left_rotation", label: "Upper arm rotation"},
        {name: "elbow_left", label: "Elbow position"},
        {name: "lower_arm_left_rotation", label: "Lower arm rotation"},
        {name: "wrist_left", label: "Wrist position"},
        {name: "shoulder_vertical_left", label: "Shoulder vertical"},
        {name: "shoulder_horizontal_left", label: "Shoulder horizontal"},
    ];
    rightArm = [
        {name: "upper_arm_right_rotation", label: "Upper arm rotation"},
        {name: "elbow_right", label: "Elbow position"},
        {name: "lower_arm_right_rotation", label: "Lower arm rotation"},
        {name: "wrist_right", label: "Wrist position"},
        {name: "shoulder_vertical_right", label: "Shoulder vertical"},
        {name: "shoulder_horizontal_right", label: "Shoulder horizontal"},
    ];
    head = [
        {name: "tilt_forward_motor", label: "Tilt forward"},
        {name: "tilt_sideways_motor", label: "Tilt sideways"},
        {name: "turn_head_motor", label: "Head rotation"},
    ];

    motors: Motor[] = [];
    motorsSubject: BehaviorSubject<Motor[]> = new BehaviorSubject<Motor[]>([]);

    constructor(
        private rosService: RosService,
        private apiService: ApiService,
    ) {
        this.createMotors();
        this.motorsSubject.next(this.motors);
        this.subscribeJointTrajectorySubject();
        this.subscribeMotorSettingsSubject();
        this.getAllMotorSettingsFromDb();
    }

    createMotors() {
        for (const s of this.leftFingers) {
            this.motors.push(
                new Motor(
                    s.name,
                    0,
                    Group.left_hand,
                    s.label,
                    undefined,
                ).init(),
            );
        }
        for (const s of this.rightFingers) {
            this.motors.push(
                new Motor(
                    s.name,
                    0,
                    Group.right_hand,
                    s.label,
                    undefined,
                ).init(),
            );
        }
        for (const s of this.leftArm) {
            this.motors.push(
                new Motor(s.name, 0, Group.left_arm, s.label, undefined).init(),
            );
        }
        for (const s of this.rightArm) {
            this.motors.push(
                new Motor(
                    s.name,
                    0,
                    Group.right_arm,
                    s.label,
                    undefined,
                ).init(),
            );
        }
        for (const s of this.head) {
            this.motors.push(
                new Motor(s.name, 0, Group.head, s.label, undefined).init(),
            );
        }
    }

    printAllMotors() {
        for (const m of this.motors) {
            console.log(m.toString());
        }
    }

    public getMotorsByGroup(group: Group): Motor[] {
        return this.motors.filter((m) => m.group === group);
    }
    public getActiveMotorsByGroup(group: Group): Observable<Motor[]> {
        return from(this.motorsSubject).pipe(
            map((m) =>
                m.filter(
                    (n) => n.group === group && n.settings.visible === true,
                ),
            ),
        );
    }
    public getMotorsByGroupNoOpposition(group: Group): Motor[] {
        return this.getMotorsByGroup(group).filter(
            (m: Motor) => !m.name.includes("opposition"),
        );
    }
    public getMotorByName(name: string): Motor {
        return (
            this.motors.find((m) => m.name === name) ??
            new Motor(name, 0, Group.none, "")
        );
    }
    public getMotorByHardwareId(hwId: string): Motor | undefined {
        return this.motors.find((m) => m.hardware_id === hwId);
    }
    public getMotorByTurnedOn(turnedOn: boolean): Motor[] {
        return this.motors.filter((m) => m.settings.turnedOn === turnedOn);
    }
    public getMotorSubjectByName(
        name: string,
    ): BehaviorSubject<Motor> | undefined {
        return this.motors.find((m) => m.name === name)?.motorSubject;
    }

    public updateMotorFromComponent(motorCopy: Motor) {
        const motor = this.getMotorByName(motorCopy.name);
        if (motor.updateChangedAttribute(motorCopy)) {
            this.sendJointTrajectoryMessage(motor);
        }
        if (motor.settings.updateChangedAttribute(motorCopy.settings)) {
            this.sendMotorSettingsMessage(motor);
        }
    }

    sendJointTrajectoryMessage(motor: Motor) {
        this.rosService.sendJointTrajectoryMessage(
            motor.parseMotorToJointTrajectoryMessage(),
        );
    }

    sendMotorSettingsMessage(motor: Motor) {
        this.rosService.sendMotorSettingsMessage(
            motor.parseMotorToSettingsMessage(),
        );
    }

    subscribeJointTrajectorySubject() {
        this.rosService.jointTrajectoryReceiver$.subscribe(
            (message: JointTrajectoryMessage) => {
                this.updateMotorFromJointTrajectoryMessage(message);
            },
        );
    }

    subscribeMotorSettingsSubject() {
        this.rosService.motorSettingsReceiver$.subscribe(
            (message: MotorSettingsMessage) => {
                this.updateMotorSettingsFromMotorSettingsMessage(message);
            },
        );
    }

    updateMotorFromJointTrajectoryMessage(message: JointTrajectoryMessage) {
        message.joint_names.forEach((motorname, index) => {
            const motor = this.getMotorByName(motorname);
            motor.updateMotorFromJointTrajectoryMessage(message.points[index]);
            const copy = motor?.clone();
            motor.motorSubject.next(copy);
        });
        if (message.joint_names[0].includes("all")) {
            const motor = this.getMotorByName(message.joint_names[0]);
            const groupMotors = this.motors
                .filter((m) => m.group == motor.group)
                .filter(
                    (m) =>
                        !m.name.includes("opposition") &&
                        !m.name.includes("all"),
                );
            groupMotors.forEach((m) => {
                message.joint_names[0] = m.name;
                this.updateMotorFromJointTrajectoryMessage(message);
            });
        }
        if (message.joint_names[0].includes("all")) {
            const motor = this.getMotorByName(message.joint_names[0]);
            const groupMotors = this.motors
                .filter((m) => m.group == motor.group)
                .filter(
                    (m) =>
                        !m.name.includes("opposition") &&
                        !m.name.includes("all"),
                );
            groupMotors.forEach((m) => {
                message.joint_names[0] = m.name;
                this.updateMotorFromJointTrajectoryMessage(message);
            });
        }
    }
    updateMotorSettingsFromMotorSettingsMessage(message: MotorSettingsMessage) {
        const motor = this.getMotorByName(message.motor_name);
        motor.settings.updateChangedAttribute(message);
        const copy = motor?.clone();
        motor.motorSubject.next(copy);
        if (message.motor_name.includes("all")) {
            const motor = this.getMotorByName(message.motor_name);
            const groupMotors = this.motors
                .filter((m) => m.group == motor.group)
                .filter(
                    (m) =>
                        !m.name.includes("opposition") &&
                        !m.name.includes("all"),
                );
            groupMotors.forEach((m) => {
                message.motor_name = m.name;
                this.updateMotorSettingsFromMotorSettingsMessage(message);
            });
        }
    }

    resetMotorGroupPosition(groupIdentifier: number, position = 0) {
        const group: Motor[] = this.motors.filter(
            (m) => m.group === groupIdentifier,
        );
        group.forEach((m) => {
            m.position = position;
            this.sendJointTrajectoryMessage(m);
        });
    }
    resetMotorGroupSettings(
        groupIdentifier: number,
        settings: MotorSettings = new MotorSettings(),
    ) {
        const group: Motor[] = this.motors.filter(
            (m) => m.group === groupIdentifier,
        );
        group.forEach((m) => {
            m.settings = settings;
            this.sendMotorSettingsMessage(m);
        });
    }

    updateMotorInDb(motor: Motor) {
        this.apiService
            .put(UrlConstants.MOTOR, motor.parseMotorToSettingsMessage())
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response: any) => {
                console.log(response);
            });
    }

    getMotorSettingsByNameFromDb(motorname: string) {
        const motor = this.getMotorByName(motorname);
        this.apiService
            .get(`${UrlConstants.MOTOR}/${motorname}/settings`)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response: any) => {
                motor.settings.acceleration = response["acceleration"];
                motor.settings.deceleration = response["deceleration"];
                motor.settings.pulseWidthMin = response["pulseWidthMin"];
                motor.settings.pulseWidthMax = response["pulseWidthMax"];
                motor.settings.rotationRangeMin = response["rotationRangeMin"];
                motor.settings.rotationRangeMax = response["rotationRangeMax"];
                motor.settings.velocity = response["velocity"];
                motor.settings.period = response["period"];
                motor.settings.turnedOn = response["turnedOn"];
                motor.settings.visible = response["visible"];
                motor.motorSubject.next(motor.clone());
            });
    }

    getAllMotorSettingsFromDb() {
        this.apiService
            .get(UrlConstants.MOTOR)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
                map((response) => response as {motors: MotorSettingsDTO[]}),
                map((response) => response.motors),
            )
            .subscribe((response) => {
                response.forEach((o) => {
                    console.info(JSON.stringify(o));
                    const motor = this.getMotorByName(o.name);
                    motor.settings.acceleration = o.acceleration;
                    motor.settings.deceleration = o.deceleration;
                    motor.settings.pulseWidthMin = o.pulseWidthMin;
                    motor.settings.pulseWidthMax = o.pulseWidthMax;
                    motor.settings.rotationRangeMin = o.rotationRangeMin;
                    motor.settings.rotationRangeMax = o.rotationRangeMax;
                    motor.settings.velocity = o.velocity;
                    motor.settings.period = o.period;
                    motor.settings.turnedOn = o.turnedOn;
                    motor.settings.visible = o.visible;

                    motor.motorSubject.next(motor.clone());
                    if (!motor.settings.visible) {
                        console.log(o.name);
                    }
                });
                this.motorsSubject.next(this.motors);
            });
    }
}
