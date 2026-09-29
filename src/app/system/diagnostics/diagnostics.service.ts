import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {BrickletType} from "src/app/shared/types/bricklet";

export interface DiagnosticsSummary {
    overallStatus: string;
    cpuTemperature: number;
    cpuStatus: string;
    cpuPercent?: number;
    cpuUsagePercent?: number;
    cpuUsage?: number;
    memoryUsage?: {
        total: string;
        used: string;
        free: string;
        percentUsed: number;
    };
    memoryStatus?: string;
    diskSpace: {
        total: string;
        used: string;
        free: string;
        percentUsed: number;
    };
    diskStatus: string;
    containersStatus: string;
    brickletsStatus: string;
    healthyContainersCount: number;
    totalContainersCount: number;
    totalBrickletsCount: number;
}

export interface BrickletPinTelemetry {
    pin: number;
    voltage: number;
    current: number;
}

export interface BrickletTelemetry {
    brickletNumber: number;
    uid: string;
    type: string;
    voltage: number;
    current: number;
    status: string;
    pins: BrickletPinTelemetry[];
    color?: string;
    pressState?: string;
}

export interface SystemTelemetry {
    cpuTemperature: number;
    diskSpace: {
        total: string;
        used: string;
        free: string;
        percentUsed: number;
    };
    containers: Array<{
        name: string;
        status: string;
        health: string;
    }>;
    status: string;
}

export interface HardwareConfigBrickletPin {
    brickletNumber: number;
    pin: number;
    invert: boolean;
}

export interface HardwareConfigBricklet {
    brickletNumber: number;
    uid: string;
    type?: BrickletType | string;
}

export interface HardwareConfigController {
    kind: string;
    deviceType: string | null;
    address: string;
    number: number;
    supplyVoltage: number | null;
}

export interface HardwareConfigMotor {
    name: string;
    pulseWidthMin?: number;
    pulseWidthMax?: number;
    rotationRangeMin?: number;
    rotationRangeMax?: number;
    velocity?: number;
    acceleration?: number;
    deceleration?: number;
    period?: number;
    turnedOn?: boolean;
    visible?: boolean;
    invert?: boolean;
    brickletPins?: HardwareConfigBrickletPin[];
    controllerNumber?: number | null;
    channel?: number | null;
    currentLimit?: number;
    torqueLimit?: number;
}

export interface HardwareConfig {
    version: number;
    variant?: string;
    bricklets?: HardwareConfigBricklet[];
    controllers?: HardwareConfigController[];
    motors: HardwareConfigMotor[];
}

export interface HardwareConfigValidationResult {
    valid: boolean;
    config?: HardwareConfig;
    errors: string[];
    warnings: string[];
}

const HARDWARE_CONFIG_VERSION = 2;
// Base58 (no 0, O, I, l), max 6 characters - Tinkerforge UIDs cannot contain those
// characters; a stored invalid UID kills the motors container at import time (PR-1796).
const UID_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{1,6}$/;
const VALID_BRICKLET_TYPES = new Set<string>([
    "Solid State Relay Bricklet",
    "Servo Bricklet",
    "RGB LED Button Bricklet",
]);

@Injectable({
    providedIn: "root",
})
export class DiagnosticsService {
    constructor(private apiService: ApiService) {}

    getSummary(): Observable<DiagnosticsSummary> {
        return this.apiService.get(`${UrlConstants.DIAGNOSTICS}/summary`);
    }

    getBricklets(): Observable<{bricklets: BrickletTelemetry[]}> {
        return this.apiService.get(`${UrlConstants.DIAGNOSTICS}/bricklets`);
    }

    getSystem(): Observable<SystemTelemetry> {
        return this.apiService.get(`${UrlConstants.DIAGNOSTICS}/system`);
    }

    exportHardwareConfig(): Observable<HardwareConfig> {
        return this.apiService.get(`${UrlConstants.HARDWARE_CONFIG}/export`);
    }

    importHardwareConfig(config: HardwareConfig): Observable<HardwareConfig> {
        return this.apiService.post(
            `${UrlConstants.HARDWARE_CONFIG}/import`,
            config,
        );
    }

    downloadHardwareConfig(config: HardwareConfig): void {
        const json =
            typeof config === "string"
                ? config
                : JSON.stringify(config, null, 2);
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "hardware-config.json";
        try {
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
        } catch {
            anchor.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    parseHardwareConfigFileContent(
        content: string,
    ): HardwareConfigValidationResult {
        let parsed: unknown;
        try {
            parsed = JSON.parse(content);
        } catch {
            return {
                valid: false,
                errors: ["The file does not contain valid JSON."],
                warnings: [],
            };
        }
        return this.validateHardwareConfig(parsed);
    }

    validateHardwareConfig(payload: unknown): HardwareConfigValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!this.isObject(payload)) {
            return {
                valid: false,
                errors: ["Hardware config must be a JSON object."],
                warnings,
            };
        }

        const version =
            payload["version"] === undefined
                ? HARDWARE_CONFIG_VERSION
                : payload["version"];
        if (
            typeof version !== "number" ||
            !Number.isInteger(version) ||
            version < 1 ||
            version > HARDWARE_CONFIG_VERSION
        ) {
            errors.push(
                `Unsupported hardware config version: ${String(version)}`,
            );
        }

        if (version === 1 && !Array.isArray(payload["bricklets"])) {
            errors.push(
                "Hardware config version 1 requires a 'bricklets' array.",
            );
        }
        if (version === 2 && !Array.isArray(payload["controllers"])) {
            errors.push(
                "Hardware config version 2 requires a 'controllers' array.",
            );
        }
        if (!Array.isArray(payload["motors"])) {
            errors.push("Hardware config requires a 'motors' array.");
        }

        if (errors.length > 0) {
            return {valid: false, errors, warnings};
        }

        const brickletsRaw = (payload["bricklets"] ?? []) as unknown[];
        const controllersRaw = (payload["controllers"] ?? []) as unknown[];
        const motorsRaw = payload["motors"] as unknown[];
        const bricklets: HardwareConfigBricklet[] = [];
        const controllers: HardwareConfigController[] = [];
        const motors: HardwareConfigMotor[] = [];
        const seenUids = new Set<string>();
        const seenBrickletNumbers = new Set<number>();
        const seenMotorNames = new Set<string>();
        const brickletNumbersInFile = new Set<number>();
        const controllerNumbersInFile = new Set<number>();

        brickletsRaw.forEach((entry, index) => {
            if (!this.isObject(entry)) {
                errors.push(`bricklets[${index}] must be an object.`);
                return;
            }

            const brickletNumber =
                entry["brickletNumber"] ?? entry["bricklet_number"];
            if (
                typeof brickletNumber !== "number" ||
                !Number.isInteger(brickletNumber)
            ) {
                errors.push(
                    `bricklets[${index}].brickletNumber must be an integer.`,
                );
            } else if (seenBrickletNumbers.has(brickletNumber)) {
                errors.push(
                    `Duplicate brickletNumber in import: ${brickletNumber}`,
                );
            } else {
                seenBrickletNumbers.add(brickletNumber);
                brickletNumbersInFile.add(brickletNumber);
            }

            const rawUid = entry["uid"];
            let uid = "";
            if (rawUid === undefined || rawUid === null) {
                uid = "";
            } else if (typeof rawUid !== "string") {
                errors.push(`bricklets[${index}].uid must be a string.`);
                uid = "";
            } else {
                uid = rawUid.trim();
                if (uid && !UID_PATTERN.test(uid)) {
                    errors.push(
                        `bricklets[${index}].uid has invalid format '${uid}' (expected a Base58 UID, max 6 characters, without 0, O, I or l).`,
                    );
                }
                if (uid) {
                    if (seenUids.has(uid)) {
                        errors.push(
                            `Duplicate Bricklet UID assignment: '${uid}'`,
                        );
                    } else {
                        seenUids.add(uid);
                    }
                }
            }

            const brickletType = entry["type"];
            if (brickletType !== undefined && brickletType !== null) {
                if (
                    typeof brickletType !== "string" ||
                    !VALID_BRICKLET_TYPES.has(brickletType)
                ) {
                    errors.push(
                        `bricklets[${index}].type '${String(
                            brickletType,
                        )}' is not a supported Bricklet type.`,
                    );
                }
            }

            if (
                typeof brickletNumber === "number" &&
                Number.isInteger(brickletNumber)
            ) {
                bricklets.push({
                    brickletNumber,
                    uid,
                    type:
                        typeof brickletType === "string"
                            ? brickletType
                            : undefined,
                });
            }
        });

        const supportedKinds = new Set([
            "tinkerforge_bricklet",
            "feetech_st_serial",
            "robstride_can",
        ]);
        const seenControllerAddresses = new Set<string>();
        controllersRaw.forEach((entry, index) => {
            if (!this.isObject(entry)) {
                errors.push(`controllers[${index}] must be an object.`);
                return;
            }
            const kind = entry["kind"];
            const number = entry["number"];
            const address = entry["address"] ?? "";
            const deviceType = entry["deviceType"] ?? null;
            const supplyVoltage =
                entry["supplyVoltage"] ?? entry["supply_voltage"] ?? null;

            if (typeof kind !== "string" || !supportedKinds.has(kind)) {
                errors.push(
                    `controllers[${index}].kind '${String(
                        kind,
                    )}' is not supported.`,
                );
            }
            if (
                typeof number !== "number" ||
                !Number.isInteger(number) ||
                controllerNumbersInFile.has(number)
            ) {
                errors.push(
                    `controllers[${index}].number must be a unique integer.`,
                );
            } else {
                controllerNumbersInFile.add(number);
            }
            if (typeof address !== "string") {
                errors.push(`controllers[${index}].address must be a string.`);
            } else if (address && seenControllerAddresses.has(address)) {
                errors.push(`Duplicate controller address: '${address}'`);
            } else if (address) {
                seenControllerAddresses.add(address);
            }
            if (
                deviceType !== null &&
                (kind !== "tinkerforge_bricklet" ||
                    typeof deviceType !== "string" ||
                    !VALID_BRICKLET_TYPES.has(deviceType))
            ) {
                errors.push(
                    `controllers[${index}].deviceType is not valid for '${String(
                        kind,
                    )}'.`,
                );
            }
            if (
                supplyVoltage !== null &&
                (typeof supplyVoltage !== "number" || supplyVoltage <= 0)
            ) {
                errors.push(
                    `controllers[${index}].supplyVoltage must be a positive number or null.`,
                );
            }

            if (
                typeof kind === "string" &&
                supportedKinds.has(kind) &&
                typeof number === "number" &&
                Number.isInteger(number) &&
                typeof address === "string" &&
                (deviceType === null || typeof deviceType === "string") &&
                (supplyVoltage === null || typeof supplyVoltage === "number")
            ) {
                controllers.push({
                    kind,
                    deviceType,
                    address: address.trim(),
                    number,
                    supplyVoltage,
                });
            }
        });

        motorsRaw.forEach((entry, index) => {
            if (!this.isObject(entry)) {
                errors.push(`motors[${index}] must be an object.`);
                return;
            }

            const name = entry["name"];
            if (typeof name !== "string" || !name.trim()) {
                errors.push(
                    `motors[${index}].name must be a non-empty string.`,
                );
                return;
            }

            const trimmedName = name.trim();
            if (seenMotorNames.has(trimmedName)) {
                errors.push(`Duplicate motor name in import: '${trimmedName}'`);
            } else {
                seenMotorNames.add(trimmedName);
            }

            const motor: HardwareConfigMotor = {name: trimmedName};
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "pulseWidthMin",
                "pulse_width_min",
                index,
                errors,
            );
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "pulseWidthMax",
                "pulse_width_max",
                index,
                errors,
            );
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "rotationRangeMin",
                "rotation_range_min",
                index,
                errors,
            );
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "rotationRangeMax",
                "rotation_range_max",
                index,
                errors,
            );
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "velocity",
                "velocity",
                index,
                errors,
            );
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "acceleration",
                "acceleration",
                index,
                errors,
            );
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "deceleration",
                "deceleration",
                index,
                errors,
            );
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "period",
                "period",
                index,
                errors,
            );
            this.copyOptionalMotorBoolean(
                entry,
                motor,
                "turnedOn",
                "turned_on",
                index,
                errors,
            );
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "controllerNumber",
                "controller_number",
                index,
                errors,
            );
            this.copyOptionalMotorNumber(
                entry,
                motor,
                "channel",
                "channel",
                index,
                errors,
            );
            this.copyOptionalMotorNumeric(
                entry,
                motor,
                "currentLimit",
                "current_limit",
                index,
                errors,
            );
            this.copyOptionalMotorNumeric(
                entry,
                motor,
                "torqueLimit",
                "torque_limit",
                index,
                errors,
            );
            this.copyOptionalMotorBoolean(
                entry,
                motor,
                "visible",
                "visible",
                index,
                errors,
            );
            this.copyOptionalMotorBoolean(
                entry,
                motor,
                "invert",
                "invert",
                index,
                errors,
            );

            if (version === 1) {
                const pinsRaw =
                    entry["brickletPins"] ?? entry["bricklet_pins"] ?? [];
                if (!Array.isArray(pinsRaw)) {
                    errors.push(
                        `motors[${index}].brickletPins must be an array.`,
                    );
                } else {
                    motor.brickletPins = [];
                    pinsRaw.forEach((pinEntry, pinIndex) => {
                        if (!this.isObject(pinEntry)) {
                            errors.push(
                                `motors[${index}].brickletPins[${pinIndex}] must be an object.`,
                            );
                            return;
                        }
                        const pinBrickletNumber =
                            pinEntry["brickletNumber"] ??
                            pinEntry["bricklet_number"];
                        const pin = pinEntry["pin"];
                        const invert = pinEntry["invert"] ?? false;

                        if (
                            typeof pinBrickletNumber !== "number" ||
                            !Number.isInteger(pinBrickletNumber)
                        ) {
                            errors.push(
                                `motors[${index}].brickletPins[${pinIndex}].brickletNumber must be an integer.`,
                            );
                        } else if (
                            !brickletNumbersInFile.has(pinBrickletNumber)
                        ) {
                            warnings.push(
                                `Motor '${trimmedName}' references brickletNumber ${pinBrickletNumber} that is not listed in this file (must already exist on the robot).`,
                            );
                        }

                        if (typeof pin !== "number" || !Number.isInteger(pin)) {
                            errors.push(
                                `motors[${index}].brickletPins[${pinIndex}].pin must be an integer.`,
                            );
                        }

                        if (typeof invert !== "boolean") {
                            errors.push(
                                `motors[${index}].brickletPins[${pinIndex}].invert must be a boolean.`,
                            );
                        }

                        if (
                            typeof pinBrickletNumber === "number" &&
                            Number.isInteger(pinBrickletNumber) &&
                            typeof pin === "number" &&
                            Number.isInteger(pin) &&
                            typeof invert === "boolean"
                        ) {
                            motor.brickletPins!.push({
                                brickletNumber: pinBrickletNumber,
                                pin,
                                invert,
                            });
                        }
                    });
                }
            }

            motors.push(motor);
        });

        if (version === 1 && bricklets.length === 0) {
            warnings.push("Import file contains no bricklets.");
        }

        const variant =
            typeof payload["variant"] === "string"
                ? payload["variant"].trim()
                : undefined;
        if (
            payload["variant"] !== undefined &&
            (!variant || typeof payload["variant"] !== "string")
        ) {
            errors.push("Hardware config variant must be a non-empty string.");
        }

        return {
            valid: errors.length === 0,
            config:
                errors.length === 0
                    ? {
                          version: version as number,
                          ...(version === 1 ? {bricklets} : {controllers}),
                          motors,
                          ...(variant ? {variant} : {}),
                      }
                    : undefined,
            errors,
            warnings,
        };
    }

    private copyOptionalMotorNumber(
        entry: Record<string, unknown>,
        motor: HardwareConfigMotor,
        camelKey: keyof HardwareConfigMotor,
        snakeKey: string,
        index: number,
        errors: string[],
    ): void {
        const value =
            entry[camelKey as string] !== undefined
                ? entry[camelKey as string]
                : entry[snakeKey];
        if (value === undefined) {
            return;
        }
        if (
            value === null &&
            (camelKey === "controllerNumber" || camelKey === "channel")
        ) {
            (motor as unknown as Record<string, unknown>)[camelKey as string] =
                null;
            return;
        }
        if (typeof value !== "number" || !Number.isInteger(value)) {
            errors.push(
                `motors[${index}].${String(camelKey)} must be an integer.`,
            );
            return;
        }
        (motor as unknown as Record<string, unknown>)[camelKey as string] =
            value;
    }

    private copyOptionalMotorBoolean(
        entry: Record<string, unknown>,
        motor: HardwareConfigMotor,
        camelKey: keyof HardwareConfigMotor,
        snakeKey: string,
        index: number,
        errors: string[],
    ): void {
        const value =
            entry[camelKey as string] !== undefined
                ? entry[camelKey as string]
                : entry[snakeKey];
        if (value === undefined) {
            return;
        }
        if (typeof value !== "boolean") {
            errors.push(
                `motors[${index}].${String(camelKey)} must be a boolean.`,
            );
            return;
        }
        (motor as unknown as Record<string, unknown>)[camelKey as string] =
            value;
    }

    private copyOptionalMotorNumeric(
        entry: Record<string, unknown>,
        motor: HardwareConfigMotor,
        camelKey: keyof HardwareConfigMotor,
        snakeKey: string,
        index: number,
        errors: string[],
    ): void {
        const value = entry[camelKey as string] ?? entry[snakeKey];
        if (value === undefined) return;
        if (typeof value !== "number" || !Number.isFinite(value)) {
            errors.push(
                `motors[${index}].${String(camelKey)} must be a number.`,
            );
            return;
        }
        (motor as unknown as Record<string, unknown>)[camelKey as string] =
            value;
    }

    private isObject(value: unknown): value is Record<string, unknown> {
        return (
            typeof value === "object" && value !== null && !Array.isArray(value)
        );
    }
}
