import {Injectable} from "@angular/core";
import {map, Observable} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {HardwareController} from "../types/hardware-capabilities";

export interface ConnectedSerialController {
    serial: string;
    uid?: string;
    port: string;
    kind: string;
    name: string;
}

/**
 * The controller rows of one robot (PC-124).
 *
 * Only the address is written from the UI: it is the identifier a motor bus is
 * opened with, and for a serial adapter it has to be read off the module and
 * typed in - nothing on the robot can derive it.
 */
@Injectable({
    providedIn: "root",
})
export class ControllerService {
    constructor(private readonly apiService: ApiService) {}

    /** Store one controller's address. An empty string clears it. */
    updateAddress(
        controllerNumber: number,
        address: string,
    ): Observable<HardwareController> {
        return this.apiService.put(
            `${UrlConstants.CONTROLLER}/${controllerNumber}`,
            {address},
        );
    }

    getConnectedControllers(): Observable<ConnectedSerialController[]> {
        return this.apiService
            .get(UrlConstants.CONTROLLER_CONNECTED)
            .pipe(
                map(
                    (res: {controllers?: ConnectedSerialController[]}) =>
                        res?.controllers ?? [],
                ),
            );
    }
}
