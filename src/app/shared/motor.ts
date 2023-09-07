import {Subject} from "rxjs";
import {MotorSettingsMessage} from "./motorSettingsMessage";
import {jointTrajectoryMessage} from "./rosMessageTypes/jointTrajectoryMessage";

export interface Motor {
    motor: string;
    motorSettingsReceiver$: Subject<MotorSettingsMessage>;
    jointTrajectoryReceiver$: Subject<jointTrajectoryMessage>;
}
