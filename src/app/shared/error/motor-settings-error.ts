import {MotorSettingsMessage} from "../rosMessageTypes/motorSettingsMessage";

export class MotorSettingsError extends Error {
    failedMsg!: MotorSettingsMessage;
    settingsApplied!: boolean;

    constructor(msg: MotorSettingsMessage, applied: boolean) {
        super(
            `Error while processing motor-settings-message: ${JSON.stringify(
                msg,
                null,
                2,
            )}. ${
                applied
                    ? "Settings were successfully applied to motor, but failed to persist."
                    : "Setting were neither applied to motor, nor were they persisted."
            }`,
        );
        this.failedMsg = msg;
        this.settingsApplied = applied;
    }
}
