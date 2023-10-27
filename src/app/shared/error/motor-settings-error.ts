import {MotorSettingsMessage} from "../rosMessageTypes/motorSettingsMessage";

export class MotorSettingsError extends Error {
    failedToApplyMsg!: MotorSettingsMessage;

    constructor(msg: MotorSettingsMessage) {
        super(
            `Failed to apply settings from message: ${JSON.stringify(
                msg,
                null,
                2,
            )}.`,
        );
        this.failedToApplyMsg = msg;
    }
}
