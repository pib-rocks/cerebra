export type HardwareFeedback =
    | "current"
    | "target_position"
    | "actual_position"
    | "temperature";

export interface HardwareCapability {
    kind: string;
    installedControllers: number;
    feedback: HardwareFeedback[];
    meaningfulSettings: string[];
}

export interface HardwareCapabilitiesResponse {
    capabilities: HardwareCapability[];
}

export interface HardwareController {
    kind: string;
    deviceType: string | null;
    address: string | null;
    number: number;
    supplyVoltage: number | null;
}

export interface HardwareControllersResponse {
    controllers: HardwareController[];
}
