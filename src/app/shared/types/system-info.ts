export type ContainerHealth = "healthy" | "unhealthy" | "starting" | "none" | "unknown";

export interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: string;
    health: ContainerHealth;
    startedAt?: string;
    ports: string[];
}

export interface DockerContainerLogs {
    name: string;
    logs: string;
}

export interface SystemInfo {
    hostname: string;
    os: {
        prettyName: string;
        versionId: string;
        id: string;
    };
    arch: string;
    kernel: string;
    cpu: {
        model: string;
        cores: number;
        usagePercent?: number;
    };
    memory: {
        totalMb: number;
        usedMb: number;
        availableMb: number;
    };
    temperatureC: number | null;
    uptimeSeconds: number | null;
    loadAverage: {
        oneMinute: number;
        fiveMinutes: number;
        fifteenMinutes: number;
    } | null;
    hostIp: string | null;
}

export interface ServoPinStatus {
    pin: number;
    motorName: string | null;
    invert: boolean;
    connected: boolean;
    enabled: boolean | null;
    currentMa: number | null;
    position: number | null;
    voltageMv: number | null;
}

export interface BrickletIdentity {
    uid: string;
    connectedUid?: string;
    position?: string;
    hardwareVersion?: number[];
    firmwareVersion?: number[];
    deviceIdentifier?: number;
}

export interface BrickletStatus {
    brickletNumber: number;
    uid: string | null;
    type: string;
    connected: boolean;
    identity: BrickletIdentity | null;
    servo: {
        pins: ServoPinStatus[];
        voltageMv: number | null;
    } | null;
    relay: {
        turnedOn: boolean | null;
        connected: boolean;
    } | null;
    rgbButton: {
        connected: boolean;
        color: {r: number; g: number; b: number} | null;
        buttonState: "pressed" | "released" | null;
        identity: BrickletIdentity | null;
    } | null;
}

export interface BrickletsStatusResponse {
    bricklets: BrickletStatus[];
    tinkerforgeConnected: boolean;
}
