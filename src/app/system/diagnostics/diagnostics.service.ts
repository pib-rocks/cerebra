import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "src/app/shared/services/api.service";
import { UrlConstants } from "src/app/shared/services/url.constants";
import { BrickletType } from "src/app/shared/types/bricklet";

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
}

export interface HardwareConfig {
  version: number;
  bricklets: HardwareConfigBricklet[];
  motors: HardwareConfigMotor[];
}

export interface HardwareConfigValidationResult {
  valid: boolean;
  config?: HardwareConfig;
  errors: string[];
  warnings: string[];
}

const HARDWARE_CONFIG_VERSION = 1;
const UID_PATTERN = /^[A-Za-z0-9]{1,6}$/;
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

  getBricklets(): Observable<{ bricklets: BrickletTelemetry[] }> {
    return this.apiService.get(`${UrlConstants.DIAGNOSTICS}/bricklets`);
  }

  getSystem(): Observable<SystemTelemetry> {
    return this.apiService.get(`${UrlConstants.DIAGNOSTICS}/system`);
  }

  exportHardwareConfig(): Observable<HardwareConfig> {
    return this.apiService.get(`${UrlConstants.HARDWARE_CONFIG}/export`);
  }

  importHardwareConfig(config: HardwareConfig): Observable<HardwareConfig> {
    return this.apiService.post(`${UrlConstants.HARDWARE_CONFIG}/import`, config);
  }

  downloadHardwareConfig(config: HardwareConfig): void {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hardware-config.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  parseHardwareConfigFileContent(content: string): HardwareConfigValidationResult {
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
      payload["version"] === undefined ? HARDWARE_CONFIG_VERSION : payload["version"];
    if (
      typeof version !== "number" ||
      !Number.isInteger(version) ||
      version < 1 ||
      version > HARDWARE_CONFIG_VERSION
    ) {
      errors.push(`Unsupported hardware config version: ${String(version)}`);
    }

    if (!Array.isArray(payload["bricklets"])) {
      errors.push("Hardware config requires a 'bricklets' array.");
    }
    if (!Array.isArray(payload["motors"])) {
      errors.push("Hardware config requires a 'motors' array.");
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    const brickletsRaw = payload["bricklets"] as unknown[];
    const motorsRaw = payload["motors"] as unknown[];
    const bricklets: HardwareConfigBricklet[] = [];
    const motors: HardwareConfigMotor[] = [];
    const seenUids = new Set<string>();
    const seenBrickletNumbers = new Set<number>();
    const seenMotorNames = new Set<string>();
    const brickletNumbersInFile = new Set<number>();

    brickletsRaw.forEach((entry, index) => {
      if (!this.isObject(entry)) {
        errors.push(`bricklets[${index}] must be an object.`);
        return;
      }

      const brickletNumber = entry["brickletNumber"] ?? entry["bricklet_number"];
      if (typeof brickletNumber !== "number" || !Number.isInteger(brickletNumber)) {
        errors.push(`bricklets[${index}].brickletNumber must be an integer.`);
      } else if (seenBrickletNumbers.has(brickletNumber)) {
        errors.push(`Duplicate brickletNumber in import: ${brickletNumber}`);
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
            `bricklets[${index}].uid has invalid format '${uid}' (expected alphanumeric, max 6 characters).`,
          );
        }
        if (uid) {
          if (seenUids.has(uid)) {
            errors.push(`Duplicate Bricklet UID assignment: '${uid}'`);
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
            `bricklets[${index}].type '${String(brickletType)}' is not a supported Bricklet type.`,
          );
        }
      }

      if (typeof brickletNumber === "number" && Number.isInteger(brickletNumber)) {
        bricklets.push({
          brickletNumber,
          uid,
          type: typeof brickletType === "string" ? brickletType : undefined,
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
        errors.push(`motors[${index}].name must be a non-empty string.`);
        return;
      }

      const trimmedName = name.trim();
      if (seenMotorNames.has(trimmedName)) {
        errors.push(`Duplicate motor name in import: '${trimmedName}'`);
      } else {
        seenMotorNames.add(trimmedName);
      }

      const motor: HardwareConfigMotor = { name: trimmedName };
      this.copyOptionalMotorNumber(entry, motor, "pulseWidthMin", "pulse_width_min", index, errors);
      this.copyOptionalMotorNumber(entry, motor, "pulseWidthMax", "pulse_width_max", index, errors);
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
      this.copyOptionalMotorNumber(entry, motor, "velocity", "velocity", index, errors);
      this.copyOptionalMotorNumber(entry, motor, "acceleration", "acceleration", index, errors);
      this.copyOptionalMotorNumber(entry, motor, "deceleration", "deceleration", index, errors);
      this.copyOptionalMotorNumber(entry, motor, "period", "period", index, errors);
      this.copyOptionalMotorBoolean(entry, motor, "turnedOn", "turned_on", index, errors);
      this.copyOptionalMotorBoolean(entry, motor, "visible", "visible", index, errors);
      this.copyOptionalMotorBoolean(entry, motor, "invert", "invert", index, errors);

      const pinsRaw = entry["brickletPins"] ?? entry["bricklet_pins"] ?? [];
      if (!Array.isArray(pinsRaw)) {
        errors.push(`motors[${index}].brickletPins must be an array.`);
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
            pinEntry["brickletNumber"] ?? pinEntry["bricklet_number"];
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

      motors.push(motor);
    });

    if (bricklets.length === 0) {
      warnings.push("Import file contains no bricklets.");
    }

    return {
      valid: errors.length === 0,
      config:
        errors.length === 0
          ? {
              version: version as number,
              bricklets,
              motors,
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
    if (typeof value !== "number" || !Number.isInteger(value)) {
      errors.push(`motors[${index}].${String(camelKey)} must be an integer.`);
      return;
    }
    (motor as unknown as Record<string, unknown>)[camelKey as string] = value;
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
      errors.push(`motors[${index}].${String(camelKey)} must be a boolean.`);
      return;
    }
    (motor as unknown as Record<string, unknown>)[camelKey as string] = value;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
