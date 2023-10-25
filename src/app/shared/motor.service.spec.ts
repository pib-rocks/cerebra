import {TestBed} from "@angular/core/testing";

import {MotorService} from "./motor.service";
import {Group} from "./types/motor.enum";
import {Motor} from "./types/motor.class";
import {MotorSettings} from "./types/motor-settings.class";
import {RosService} from "./ros.service";
import {
    JointTrajectoryMessage,
    createEmptyJointTrajectoryMessage,
} from "./rosMessageTypes/jointTrajectoryMessage";
import {MotorSettingsMessage} from "./rosMessageTypes/motorSettingsMessage";
import {createJointTrajectoryPoint} from "./rosMessageTypes/jointTrajectoryPoint";

describe("MotorService", () => {
    let service: MotorService;
    let rosService: RosService;
    let spyOnMotors: jasmine.Spy<() => void>;
    beforeEach(() => {
        TestBed.configureTestingModule({providers: [MotorService, RosService]});
        service = TestBed.inject(MotorService);
        rosService = TestBed.inject(RosService);
        rosService.initTopics();
        rosService.initSubscribers();
        spyOnMotors = spyOn(service, "createMotors").and.callThrough();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should create all Motors", () => {
        service.createMotors();
        expect(spyOnMotors).toHaveBeenCalled();
        expect(service.leftFingers.length).toBe(7);
        expect(service.rightFingers.length).toBe(7);
        expect(service.leftArm.length).toBe(6);
        expect(service.rightArm.length).toBe(6);
        expect(service.head.length).toBe(3);
        expect(service.motors.length).not.toBe(0);
    });

    it("should return an array of motors on calling getMotorsByGroup", () => {
        const spyOnGetMotorsByGroup = spyOn(
            service,
            "getMotorsByGroup",
        ).and.callThrough();
        const left_hand = service.getMotorsByGroup(Group.left_hand);
        const right_hand = service.getMotorsByGroup(Group.right_hand);
        const left_arm = service.getMotorsByGroup(Group.left_arm);
        const right_arm = service.getMotorsByGroup(Group.right_arm);
        const head = service.getMotorsByGroup(Group.head);
        expect(spyOnGetMotorsByGroup).toHaveBeenCalled();
        expect(left_hand.length).toBe(7);
        expect(right_hand.length).toBe(7);
        expect(left_arm.length).toBe(6);
        expect(right_arm.length).toBe(6);
        expect(head.length).toBe(3);
    });

    it("should return an array of motors on calling getMotorsByGroupNoOpposition", () => {
        const spyOnGetMotorsByGroupNoOpposition = spyOn(
            service,
            "getMotorsByGroupNoOpposition",
        ).and.callThrough();
        const left_hand = service.getMotorsByGroupNoOpposition(Group.left_hand);
        const right_hand = service.getMotorsByGroupNoOpposition(
            Group.right_hand,
        );
        expect(spyOnGetMotorsByGroupNoOpposition).toHaveBeenCalled();
        expect(left_hand.length).toBe(6);
        expect(right_hand.length).toBe(6);
    });

    it("should return a distinct on calling getMotorByName", () => {
        const spyOnGetMotorByName = spyOn(
            service,
            "getMotorByName",
        ).and.callThrough();
        const actualMotor = service.getMotorByName("thumb_left_stretch");
        expect(spyOnGetMotorByName).toHaveBeenCalled();
        expect(actualMotor).toBeTruthy();
    });

    it("should return a distinct motor or undefined on calling getMotorByHardwareId", () => {
        const spyOnGetMotorByHardwareId = spyOn(
            service,
            "getMotorByHardwareId",
        ).and.callThrough();
        const editMotor = service.getMotorByName("thumb_left_stretch");
        editMotor.hardware_id = "123";
        const actualMotor = service.getMotorByHardwareId("123");
        const undefinedMotor = service.getMotorByHardwareId("undefined_motor");
        expect(spyOnGetMotorByHardwareId).toHaveBeenCalled();
        expect(actualMotor).toBeTruthy();
        expect(undefinedMotor).toBeUndefined();
    });

    it("should return in/active motors on calling getMotorByTurnedOn", () => {
        const spyOnGetMotorByTurnedOn = spyOn(
            service,
            "getMotorByTurnedOn",
        ).and.callThrough();
        let activeMotors = service.getMotorByTurnedOn(true);
        let inactiveMotor = service.getMotorByTurnedOn(false);
        expect(spyOnGetMotorByTurnedOn).toHaveBeenCalled();
        expect(activeMotors.length).toBe(29);
        expect(inactiveMotor.length).toBe(0);
        const editMotor = service.getMotorByName("thumb_left_stretch");
        editMotor.settings.turnedOn = false;
        activeMotors = service.getMotorByTurnedOn(true);
        inactiveMotor = service.getMotorByTurnedOn(false);
        expect(activeMotors.length).toBe(28);
        expect(inactiveMotor.length).toBe(1);
    });

    it("should return the MotorSubject on calling getMotorSubjectByName", () => {
        const spyOnGetMotorSubjectByName = spyOn(
            service,
            "getMotorSubjectByName",
        ).and.callThrough();
        const actualMotorSubject =
            service.getMotorSubjectByName("thumb_left_stretch");
        const undefinedMotorSubject =
            service.getMotorSubjectByName("undefined_motor");
        expect(spyOnGetMotorSubjectByName).toHaveBeenCalled();
        expect(actualMotorSubject).toBeTruthy();
        expect(undefinedMotorSubject).toBeUndefined();
    });

    it("should update a motor on updateMotorFromComponent", () => {
        const spyOnUpdateMotorFromComponent = spyOn(
            service,
            "updateMotorFromComponent",
        ).and.callThrough();
        const updateMotor = new Motor(
            "thumb_left_stretch",
            500,
            Group.left_hand,
            "undefined_label",
            new MotorSettings(500, 500, 500, 500, 500, 500, 500, 500, false),
        );
        service.updateMotorFromComponent(updateMotor);
        expect(spyOnUpdateMotorFromComponent).toHaveBeenCalled();
        const updatedMotor = service.getMotorByName("thumb_left_stretch");
        expect(updatedMotor.position).toBe(500);
        expect(updatedMotor.settings.acceleration).toBe(500);
        expect(updatedMotor.settings.deceleration).toBe(500);
        expect(updatedMotor.settings.period).toBe(500);
        expect(updatedMotor.settings.pulseWidthMax).toBe(500);
        expect(updatedMotor.settings.pulseWidthMin).toBe(500);
        expect(updatedMotor.settings.rotationRangeMax).toBe(500);
        expect(updatedMotor.settings.rotationRangeMin).toBe(500);
        expect(updatedMotor.settings.turnedOn).toBe(false);
    });

    it("should send a JointTrajectoryMessage on sendJointTrajectoryMessage", () => {
        const spyOnSendJointTrajectoryMessage = spyOn(
            service,
            "sendJointTrajectoryMessage",
        ).and.callThrough();
        const spyOnRosServiceSendJointTrajectoryMessage = spyOn(
            rosService,
            "sendJointTrajectoryMessage",
        ).and.callThrough();
        const updateMotor = new Motor(
            "thumb_left_stretch",
            500,
            Group.left_hand,
            "undefined_label",
            new MotorSettings(500, 500, 500, 500, 500, 500, 500, 500, false),
        );
        const spyOnParseMotorToJointTrajectoryMessage = spyOn(
            updateMotor,
            "parseMotorToJointTrajectoryMessage",
        ).and.callThrough();
        service.sendJointTrajectoryMessage(updateMotor);
        expect(spyOnSendJointTrajectoryMessage).toHaveBeenCalledWith(
            updateMotor,
        );
        expect(spyOnParseMotorToJointTrajectoryMessage).toHaveBeenCalled();
        expect(spyOnRosServiceSendJointTrajectoryMessage).toHaveBeenCalledWith(
            updateMotor.parseMotorToJointTrajectoryMessage(),
        );
    });

    it("should send a MotorSettingsMessage on sendMotorSettingsMessage", () => {
        const spyOnSendMotorSettingsMessage = spyOn(
            service,
            "sendMotorSettingsMessage",
        ).and.callThrough();
        const spyOnRosServiceSendMotorSettingsMessage = spyOn(
            rosService,
            "sendMotorSettingsMessage",
        ).and.callThrough();
        const updateMotor = new Motor(
            "thumb_left_stretch",
            500,
            Group.left_hand,
            "undefined_label",
            new MotorSettings(500, 500, 500, 500, 500, 500, 500, 500, false),
        );
        const spyOnParseMotorToJointTrajectoryMessage = spyOn(
            updateMotor,
            "parseMotorToSettingsMessage",
        ).and.callThrough();
        service.sendMotorSettingsMessage(updateMotor);
        expect(spyOnSendMotorSettingsMessage).toHaveBeenCalledWith(updateMotor);
        expect(spyOnParseMotorToJointTrajectoryMessage).toHaveBeenCalled();
        expect(spyOnRosServiceSendMotorSettingsMessage).toHaveBeenCalledWith(
            updateMotor.parseMotorToSettingsMessage(),
        );
    });

    it("should call updateMotorFromJointTrajectoryMessage on receiving a subscriber event from rosService.jointTrajectoryReceiver$", () => {
        const spyOnUpdateMotorFromJointTrajectoryMessage = spyOn(
            service,
            "updateMotorFromJointTrajectoryMessage",
        );
        rosService.jointTrajectoryReceiver$.next({} as JointTrajectoryMessage);
        expect(spyOnUpdateMotorFromJointTrajectoryMessage).toHaveBeenCalled();
    });

    it("should call updateMotorSettingsFromMotorSettingsMessage on receiving a subscriber event from rosService.motorSettingsReceiver$", () => {
        const spyOnUpdateMotorSettingsFromMotorSettingsMessage = spyOn(
            service,
            "updateMotorSettingsFromMotorSettingsMessage",
        );
        rosService.motorSettingsReceiver$.next({} as MotorSettingsMessage);
        expect(
            spyOnUpdateMotorSettingsFromMotorSettingsMessage,
        ).toHaveBeenCalled();
    });

    it("should update motors on calling updateMotorFromJointTrajectoryMessage", () => {
        const jointnames = ["all_fingers_right", "pinky_left_stretch"];
        const points = [
            createJointTrajectoryPoint(800),
            createJointTrajectoryPoint(500),
        ];
        const jointTrajectoryMessage = createEmptyJointTrajectoryMessage();
        jointTrajectoryMessage.joint_names = jointnames;
        jointTrajectoryMessage.points = points;
        const spyOnUpdateMotorFromJointTrajectoryMessage = spyOn(
            service,
            "updateMotorFromJointTrajectoryMessage",
        ).and.callThrough();
        service.updateMotorFromJointTrajectoryMessage(jointTrajectoryMessage);
        const pinky_left_stretch = service.getMotorByName("pinky_left_stretch");
        const all_fingers_right = service.getMotorByName("all_fingers_right");
        const thumb_right_stretch = service.getMotorByName(
            "thumb_right_stretch",
        );
        const index_right_stretch = service.getMotorByName(
            "index_right_stretch",
        );
        const middle_right_stretch = service.getMotorByName(
            "middle_right_stretch",
        );
        const ring_right_stretch = service.getMotorByName("ring_right_stretch");
        const pinky_right_stretch = service.getMotorByName(
            "pinky_right_stretch",
        );
        expect(spyOnUpdateMotorFromJointTrajectoryMessage).toHaveBeenCalledWith(
            jointTrajectoryMessage,
        );
        expect(pinky_left_stretch.position).toBe(500);
        expect(all_fingers_right.position).toBe(800);
        expect(thumb_right_stretch.position).toBe(800);
        expect(index_right_stretch.position).toBe(800);
        expect(middle_right_stretch.position).toBe(800);
        expect(ring_right_stretch.position).toBe(800);
        expect(pinky_right_stretch.position).toBe(800);
    });

    it("should update motor.settings on calling updateMotorSettingsFromMotorSettingsMessage", () => {
        const spyOnUpdateMotorSettingsFromMotorSettingsMessage = spyOn(
            service,
            "updateMotorSettingsFromMotorSettingsMessage",
        ).and.callThrough();
        const motorSettingsMessage: MotorSettingsMessage = {
            motor_name: "pinky_left_stretch",
            turned_on: false,
            pulse_width_min: 500,
            pulse_width_max: 500,
            rotation_range_min: 500,
            rotation_range_max: 500,
            velocity: 500,
            acceleration: 500,
            deceleration: 500,
            period: 500,
        };
        service.updateMotorSettingsFromMotorSettingsMessage(
            motorSettingsMessage,
        );
        const updatedMotor = service.getMotorByName("pinky_left_stretch");
        expect(
            spyOnUpdateMotorSettingsFromMotorSettingsMessage,
        ).toHaveBeenCalled();
        expect(updatedMotor.settings.turnedOn).toBe(false);
        expect(updatedMotor.settings.pulseWidthMin).toBe(500);
        expect(updatedMotor.settings.pulseWidthMax).toBe(500);
        expect(updatedMotor.settings.rotationRangeMax).toBe(500);
        expect(updatedMotor.settings.rotationRangeMin).toBe(500);
        expect(updatedMotor.settings.velocity).toBe(500);
        expect(updatedMotor.settings.acceleration).toBe(500);
        expect(updatedMotor.settings.deceleration).toBe(500);
        expect(updatedMotor.settings.period).toBe(500);
    });

    it("should reset the position of a motor-group to 0 on calling resetMotorGroupPosition", () => {
        const spyOnResetMotorGroupPosition = spyOn(
            service,
            "resetMotorGroupPosition",
        ).and.callThrough();
        const jointnames = ["all_fingers_right"];
        const points = [createJointTrajectoryPoint(800)];
        const jointTrajectoryMessage = createEmptyJointTrajectoryMessage();
        jointTrajectoryMessage.joint_names = jointnames;
        jointTrajectoryMessage.points = points;
        service.updateMotorFromJointTrajectoryMessage(jointTrajectoryMessage);
        let motors: Motor[] = service.getMotorsByGroupNoOpposition(
            Group.right_hand,
        );
        motors.forEach((m) => {
            expect(m.position).toBe(800);
        });
        service.resetMotorGroupPosition(Group.right_hand);
        motors = service.getMotorsByGroup(Group.right_hand);
        expect(spyOnResetMotorGroupPosition).toHaveBeenCalled();
        motors.forEach((m) => {
            expect(m.position).toBe(0);
        });
    });

    it("should reset the settings of a motor-group to default settings on calling resetMotorGroupSettings", () => {
        const spyOnResetMotorGroupSettings = spyOn(
            service,
            "resetMotorGroupSettings",
        ).and.callThrough();
        const spyOnUpdateMotorSettingsFromMotorSettingsMessage = spyOn(
            service,
            "updateMotorSettingsFromMotorSettingsMessage",
        ).and.callThrough();
        const motorSettingsMessage: MotorSettingsMessage = {
            motor_name: "",
            turned_on: false,
            pulse_width_min: 500,
            pulse_width_max: 500,
            rotation_range_min: 500,
            rotation_range_max: 500,
            velocity: 500,
            acceleration: 500,
            deceleration: 500,
            period: 500,
        };
        const motors: Motor[] = service.getMotorsByGroupNoOpposition(
            Group.right_hand,
        );
        motors.forEach((m) => {
            motorSettingsMessage.motor_name = m.name;
            service.updateMotorSettingsFromMotorSettingsMessage(
                motorSettingsMessage,
            );
        });
        expect(
            spyOnUpdateMotorSettingsFromMotorSettingsMessage,
        ).toHaveBeenCalled();
        motors.forEach((m) => {
            expect(m.settings.velocity).toBe(500);
            expect(m.settings.acceleration).toBe(500);
            expect(m.settings.deceleration).toBe(500);
            expect(m.settings.period).toBe(500);
            expect(m.settings.pulseWidthMin).toBe(500);
            expect(m.settings.pulseWidthMax).toBe(500);
            expect(m.settings.rotationRangeMax).toBe(500);
            expect(m.settings.rotationRangeMin).toBe(500);
            expect(m.settings.turnedOn).toBe(false);
        });
        service.resetMotorGroupSettings(Group.right_hand);
        expect(spyOnResetMotorGroupSettings).toHaveBeenCalled();
        motors.forEach((m) => {
            expect(m.settings.velocity).toBe(0);
            expect(m.settings.acceleration).toBe(0);
            expect(m.settings.deceleration).toBe(0);
            expect(m.settings.period).toBe(0);
            expect(m.settings.pulseWidthMin).toBe(0);
            expect(m.settings.pulseWidthMax).toBe(65535);
            expect(m.settings.rotationRangeMin).toBe(-9000);
            expect(m.settings.rotationRangeMax).toBe(9000);
            expect(m.settings.turnedOn).toBe(true);
        });
        motors.forEach((m) => {
            expect(m.position).toBe(0);
        });
    });
});
