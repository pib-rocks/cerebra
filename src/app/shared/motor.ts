import {Subject} from "rxjs";
import {MotorSettingsMessage} from "./motorSettingsMessage";
import {JointTrajectoryMessage} from "./rosMessageTypes/jointTrajectoryMessage";
//Remove in PR-318
export interface Motor {
    motor: string;
    motorSettingsReceiver$: Subject<MotorSettingsMessage>;
    jointTrajectoryReceiver$: Subject<JointTrajectoryMessage>;
}
