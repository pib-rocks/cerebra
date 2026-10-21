import {Injectable} from "@angular/core";
import {Observable, catchError, map, of} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {ProviderHealth, parseProviderHealth} from "../types/provider-health";

/**
 * Asks pib-backend whether the provider of one catalogue row is usable (PC-115).
 *
 * The browser never calls an upstream provider itself: the credentials live in
 * the robot key store and https://api.pib.rocks/health refuses a browser
 * preflight with 405. A backend that cannot be reached is reported as
 * `unknown`, so a broken route never paints a provider red.
 */
@Injectable({
    providedIn: "root",
})
export class ProviderHealthService {
    constructor(private readonly apiService: ApiService) {}

    check(modelId: number): Observable<ProviderHealth> {
        return this.apiService
            .get(`${UrlConstants.PROVIDER}/${modelId}/health`)
            .pipe(
                map((raw) => parseProviderHealth(raw)),
                catchError(() =>
                    of<ProviderHealth>({
                        state: "unknown",
                        reason: "backend_unavailable",
                    }),
                ),
            );
    }
}
