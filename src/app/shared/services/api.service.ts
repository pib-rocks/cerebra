import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
    providedIn: "root",
})
export class ApiService {
    constructor(private http: HttpClient) {}

    baseUrl = "/api";

    get(url: string): Observable<any> {
        return this.http.get(this.baseUrl + url);
    }

    post(url: string, requestBody: object): Observable<any> {
        return this.http.post(this.baseUrl + url, requestBody);
    }

    put(url: string, requestBody: object): Observable<any> {
        return this.http.put(this.baseUrl + url, requestBody);
    }

    delete(url: string, pathParam?: string): Observable<any> {
        return this.http.delete(
            this.baseUrl + url + (pathParam ? "/" + pathParam : ""),
        );
    }
}
