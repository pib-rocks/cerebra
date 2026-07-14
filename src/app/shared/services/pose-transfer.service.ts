import {Injectable} from "@angular/core";
import {
    PoseImportValidationResult,
    PoseTransfer,
    PoseTransferFile,
} from "../types/pose-transfer";

@Injectable({
    providedIn: "root",
})
export class PoseTransferService {
    public parsePoseFileContent(content: string): PoseImportValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        let parsed: unknown;

        try {
            parsed = JSON.parse(content);
        } catch {
            return {
                valid: false,
                errors: ["Die Datei enthaelt kein gueltiges JSON."],
                warnings: [],
            };
        }

        const pose = this.extractPose(parsed);

        if (!pose) {
            return {
                valid: false,
                errors: ["Die Datei enthaelt keine gueltige Pose."],
                warnings,
            };
        }

        if (typeof pose.name !== "string" || pose.name.trim().length < 2) {
            errors.push(
                "Die Pose braucht einen Namen mit mindestens 2 Zeichen.",
            );
        }

        if (!Array.isArray(pose.motorPositions)) {
            errors.push("Die Pose braucht eine Liste motorPositions.");
        } else {
            const seenMotorNames = new Set<string>();

            pose.motorPositions.forEach((motorPosition, index) => {
                if (
                    !motorPosition ||
                    typeof motorPosition.motorName !== "string" ||
                    motorPosition.motorName.trim().length === 0
                ) {
                    errors.push(
                        `Motorposition ${
                            index + 1
                        } braucht einen gueltigen motorName.`,
                    );
                }

                if (
                    typeof motorPosition.position !== "number" ||
                    Number.isNaN(motorPosition.position)
                ) {
                    errors.push(
                        `Motorposition ${
                            index + 1
                        } braucht eine numerische position.`,
                    );
                }

                if (
                    typeof motorPosition.motorName === "string" &&
                    seenMotorNames.has(motorPosition.motorName)
                ) {
                    warnings.push(
                        `Motor ${motorPosition.motorName} kommt mehrfach vor.`,
                    );
                }

                if (typeof motorPosition.motorName === "string") {
                    seenMotorNames.add(motorPosition.motorName);
                }
            });
        }

        return {
            valid: errors.length === 0,
            pose: {
                name: pose.name.trim(),
                motorPositions: pose.motorPositions,
            },
            errors,
            warnings,
        };
    }

    public downloadPose(pose: PoseTransfer): void {
        const file: PoseTransferFile = {
            format: "pib-pose",
            version: 1,
            exportedAt: new Date().toISOString(),
            pose,
        };

        const json = JSON.stringify(file, null, 2);
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${this.toSafeFileName(pose.name)}.pib-pose.json`;
        anchor.click();

        URL.revokeObjectURL(url);
    }

    private extractPose(data: unknown): PoseTransfer | undefined {
        if (!this.isObject(data)) return undefined;

        if (
            data["format"] === "pib-pose" &&
            data["version"] === 1 &&
            this.isObject(data["pose"])
        ) {
            return data["pose"] as PoseTransfer;
        }

        return data as PoseTransfer;
    }

    private isObject(value: unknown): value is Record<string, any> {
        return typeof value === "object" && value !== null;
    }

    private toSafeFileName(value: string): string {
        return value
            .trim()
            .replace(/[^a-zA-Z0-9-_]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .toLowerCase();
    }
}
