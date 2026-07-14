import {MotorPosition} from "./motor-position";

export interface PoseTransferFile {
    format: "pib-pose";
    version: 1;
    exportedAt?: string;
    pose: PoseTransfer;
}

export interface PoseTransfer {
    name: string;
    motorPositions: MotorPosition[];
}

export interface PoseImportValidationResult {
    valid: boolean;
    pose?: PoseTransfer;
    errors: string[];
    warnings: string[];
}
