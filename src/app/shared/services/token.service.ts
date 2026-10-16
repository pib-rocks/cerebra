import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {TokenProbeState} from "../types/provider-registry";
import {RosService} from "./ros-service/ros.service";

export interface TokenStatus {
    /**
     * Resolved only when `service` is `"available"`. Null is unknown, not
     * a missing token.
     */
    tokenExists: boolean | null;
    tokenActive: boolean | null;
    service: TokenProbeState;
    error: string | null;
}

export const UNKNOWN_TOKEN_STATUS: TokenStatus = {
    tokenExists: null,
    tokenActive: null,
    service: "unknown",
    error: null,
};

/**
 * Older callers publish only the two booleans. A boolean is a resolved
 * probe. A missing boolean, or an explicit non-available service, is not
 * absence.
 */
export function normalizeTokenStatus(status: {
    tokenExists?: boolean | null;
    tokenActive?: boolean | null;
    service?: TokenProbeState;
    error?: string | null;
}): TokenStatus {
    const service =
        status.service ??
        (status.tokenExists == null && status.tokenActive == null
            ? "unknown"
            : "available");
    if (service !== "available") {
        return {
            tokenExists: null,
            tokenActive: null,
            service,
            error: status.error ?? null,
        };
    }
    return {
        tokenExists: status.tokenExists === true,
        tokenActive: status.tokenActive === true,
        service: "available",
        error: null,
    };
}

@Injectable({
    providedIn: "root",
})
export class TokenService {
    private readonly tokenStatusSubject = new BehaviorSubject<TokenStatus>(
        UNKNOWN_TOKEN_STATUS,
    );
    tokenStatus$ = this.tokenStatusSubject.asObservable();
    private probeGeneration = 0;

    constructor(private readonly rosService: RosService) {
        this.rosService.connectionStatus$.subscribe((isConnected) => {
            if (!isConnected) {
                this.probeGeneration++;
                this.tokenStatusSubject.next(UNKNOWN_TOKEN_STATUS);
                return;
            }
            this.checkTokenExists();
        });
    }

    checkTokenExists() {
        const generation = ++this.probeGeneration;
        this.tokenStatusSubject.next({
            tokenExists: null,
            tokenActive: null,
            service: "loading",
            error: null,
        });
        this.rosService.checkTokenExists().subscribe({
            next: (response) => {
                if (generation !== this.probeGeneration) {
                    return;
                }
                this.tokenStatusSubject.next({
                    tokenExists: response.token_exists,
                    tokenActive: response.token_active,
                    service: "available",
                    error: null,
                });
            },
            error: (error: unknown) => {
                if (generation !== this.probeGeneration) {
                    return;
                }
                this.tokenStatusSubject.next({
                    tokenExists: null,
                    tokenActive: null,
                    service: "unavailable",
                    error: serviceErrorText(error),
                });
            },
        });
    }
}

function serviceErrorText(error: unknown): string {
    if (typeof error === "string" && error.trim() !== "") {
        return error;
    }
    if (error instanceof Error && error.message.trim() !== "") {
        return error.message;
    }
    if (error == null) {
        return "Token service error";
    }
    return String(error);
}
