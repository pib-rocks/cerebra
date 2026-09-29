import {Injectable} from "@angular/core";
import {MatSnackBar} from "@angular/material/snack-bar";
import {BehaviorSubject, catchError, forkJoin, map, Observable, of} from "rxjs";
import {
    HardwareCapabilitiesResponse,
    HardwareCapability,
    HardwareController,
    HardwareControllersResponse,
    HardwareFeedback,
} from "../types/hardware-capabilities";
import {HardwareVariantResponse} from "../types/hardware-variant";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";

export interface HardwareContext {
    variant: HardwareVariantResponse;
    capabilities: HardwareCapability[];
    controllers: HardwareController[];
    fallback: boolean;
}

const EDU_FALLBACK: HardwareContext = {
    variant: {
        variant: "pib5edu",
        source: "fallback",
        supported: [],
        implementedVariants: [],
        seedProfileImplemented: false,
    },
    capabilities: [
        {
            kind: "tinkerforge_bricklet",
            installedControllers: 0,
            feedback: ["current", "target_position"],
            meaningfulSettings: [],
        },
    ],
    controllers: [],
    fallback: true,
};

@Injectable({
    providedIn: "root",
})
export class VariantService {
    private readonly contextSubject = new BehaviorSubject<HardwareContext>(
        EDU_FALLBACK,
    );

    constructor(
        private apiService: ApiService,
        private matSnackBarService: MatSnackBar,
    ) {
        this.reload();
    }

    getContextObservable(): Observable<HardwareContext> {
        return this.contextSubject.asObservable();
    }

    hasFeedback(feedback: HardwareFeedback): Observable<boolean> {
        return this.contextSubject.pipe(
            map((context) =>
                context.capabilities.some(
                    (capability) =>
                        capability.installedControllers > 0 &&
                        capability.feedback.includes(feedback),
                ),
            ),
        );
    }

    getInstalledControllerKinds(): Observable<string[]> {
        return this.contextSubject.pipe(
            map((context) =>
                context.capabilities
                    .filter((capability) => capability.installedControllers > 0)
                    .map((capability) => capability.kind),
            ),
        );
    }

    reload(): void {
        forkJoin({
            variant: this.apiService.get(
                UrlConstants.HARDWARE_VARIANT,
            ) as Observable<HardwareVariantResponse>,
            capabilities: this.apiService.get(
                UrlConstants.HARDWARE_CAPABILITIES,
            ) as Observable<HardwareCapabilitiesResponse>,
            controllers: this.apiService.get(
                UrlConstants.CONTROLLER,
            ) as Observable<HardwareControllersResponse>,
            fallback: of(false),
        })
            .pipe(
                catchError((error: unknown) => {
                    console.warn(
                        "Hardware variant information is unavailable; using educational defaults.",
                        error,
                    );
                    this.matSnackBarService.open(
                        "Hardware information unavailable. Using educational defaults.",
                        "",
                        {panelClass: "cerebra-toast", duration: 3000},
                    );
                    return of({
                        variant: EDU_FALLBACK.variant,
                        capabilities: {
                            capabilities: EDU_FALLBACK.capabilities,
                        },
                        controllers: {controllers: []},
                        fallback: true,
                    });
                }),
            )
            .subscribe(({variant, capabilities, controllers, fallback}) => {
                this.contextSubject.next({
                    variant,
                    capabilities: capabilities.capabilities,
                    controllers: controllers.controllers,
                    fallback,
                });
            });
    }
}
