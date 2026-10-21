export type SmartHomeDomain =
    | "light"
    | "switch"
    | "sensor"
    | "binary_sensor"
    | "climate"
    | "cover"
    | "lock"
    | "scene";

export interface SmartHomeDevice {
    entityId: string;
    domain: SmartHomeDomain;
    friendlyName: string;
    room: string;
    exposeToVoice: boolean;
    exposeToPrograms: boolean;
    state: string;
    attributes: Record<string, any>;
    online: boolean;
}

export interface SmartHomeHubStatus {
    homeAssistant: {
        online: boolean;
        url: string;
        onboardingComplete: boolean;
        profile: string;
        memoryCapMib: number;
    };
    matterServer: {
        online: boolean;
        url: string;
        memoryCapMib: number;
    };
    deviceCount: number;
    voiceExposedCount: number;
    supportedVariants?: string[];
}

export interface MatterCommissionRequest {
    pairingCode: string;
    friendlyName: string;
    room: string;
    domain: SmartHomeDomain;
    wifiSsid?: string;
    wifiPassword?: string;
}

export interface MatterCommissionResponse {
    commissioned: boolean;
    device: SmartHomeDevice;
}
