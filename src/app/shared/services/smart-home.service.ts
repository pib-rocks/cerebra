import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {
    MatterCommissionRequest,
    MatterCommissionResponse,
    SmartHomeDevice,
    SmartHomeHubStatus,
} from "../types/smart-home";

@Injectable({
    providedIn: "root",
})
export class SmartHomeService {
    constructor(private readonly apiService: ApiService) {}

    getStatus(): Observable<SmartHomeHubStatus> {
        return this.apiService.get(`${UrlConstants.SMART_HOME}/status`);
    }

    initializeHub(): Observable<SmartHomeHubStatus> {
        return this.apiService.post(
            `${UrlConstants.SMART_HOME}/initialize`,
            {},
        );
    }

    getDevices(room?: string): Observable<{devices: SmartHomeDevice[]}> {
        const query = room ? `?room=${encodeURIComponent(room)}` : "";
        return this.apiService.get(
            `${UrlConstants.SMART_HOME}/devices${query}`,
        );
    }

    updateDevice(
        entityId: string,
        patch: Partial<SmartHomeDevice>,
    ): Observable<SmartHomeDevice> {
        return this.apiService.put(
            `${UrlConstants.SMART_HOME}/devices/${encodeURIComponent(
                entityId,
            )}`,
            patch,
        );
    }

    deleteDevice(
        entityId: string,
    ): Observable<{deleted: boolean; entityId: string}> {
        return this.apiService.delete(
            `${UrlConstants.SMART_HOME}/devices/${encodeURIComponent(
                entityId,
            )}`,
        );
    }

    executeAction(
        entityId: string,
        action: string,
        value?: number | string | boolean,
    ): Observable<{
        action: string;
        applied: boolean;
        device: SmartHomeDevice;
    }> {
        const body: {action: string; value?: number | string | boolean} = {
            action,
        };
        if (value !== undefined) {
            body.value = value;
        }
        return this.apiService.post(
            `${UrlConstants.SMART_HOME}/devices/${encodeURIComponent(
                entityId,
            )}/action`,
            body,
        );
    }

    commissionMatterDevice(
        payload: MatterCommissionRequest,
    ): Observable<MatterCommissionResponse> {
        return this.apiService.post(
            `${UrlConstants.SMART_HOME}/matter/commission`,
            payload,
        );
    }
}
