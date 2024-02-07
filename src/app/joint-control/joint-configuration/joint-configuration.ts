import {MotorConfiguration} from "./motor-configuration";

export interface JointConfiguration {
    image: string;
    reversed: boolean;
    motors: MotorConfiguration[];
}
