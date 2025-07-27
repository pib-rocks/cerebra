import {Injectable} from "@angular/core";
import {UrlConstants} from "./url.constants";
import {map, Observable} from "rxjs";
import {ApiService} from "./api.service";

@Injectable({
    providedIn: "root",
})
export class IpService {
    constructor(private apiService: ApiService) {}

    getHostIp(): Observable<string> {
        return this.apiService
            .get(UrlConstants.HOST_IP)
            .pipe(map((response: any) => response.host_ip));
    }
}
