export interface RightUpperArmRecoveryState {
    active: boolean;
    state: string;
    motor_name: string;
    message: string;
    raw_position: number | null;
    unwrapped_position: number | null;
    target_position: number;
    progress_percent: number;
    direction: string;
    error: string;
}

export const RIGHT_UPPER_ARM_READY_STATE: RightUpperArmRecoveryState = {
    active: false,
    state: "ready",
    motor_name: "upper_arm_right_rotation",
    message: "Right upper arm is ready.",
    raw_position: null,
    unwrapped_position: null,
    target_position: 2048,
    progress_percent: 0,
    direction: "increasing",
    error: "",
};
