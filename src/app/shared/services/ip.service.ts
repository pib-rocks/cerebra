import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {UrlConstants} from "./url.constants";
import {Observable} from "rxjs";

@Injectable({
    providedIn: "root",
})
export class IpService {
    constructor(private http: HttpClient) {}

    getHostIp(): Observable<string> {
        return this.http.get<string>(UrlConstants.HOST_IP);
    }

    setHostIp(ip: string): Observable<void> {
        return this.http.post<void>(UrlConstants.HOST_IP, {ip});
    }
}
