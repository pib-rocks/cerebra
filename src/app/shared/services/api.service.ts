import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {finalize, Observable, ReplaySubject, share} from "rxjs";

/**
 * In-flight dedupe for GET only (keyed by full request URL). Identical GETs that
 * overlap share one HttpClient call; all subscribers receive the same emission or
 * error. This is not a response cache: after a GET completes or errors, the entry
 * is removed and the next GET goes to the network again. POST, PUT, PATCH, and
 * DELETE never reuse GET dedupe state; they drop any in-flight GET entry for the
 * same path so a read after a mutation cannot attach to a pre-mutation request.
 */
@Injectable({
    providedIn: "root",
})
export class ApiService {
    private readonly inFlightGets = new Map<string, Observable<unknown>>();

    constructor(private http: HttpClient) {}

    baseUrl = "/api";

    get(url: string): Observable<any> {
        const fullUrl = this.baseUrl + url;
        let shared = this.inFlightGets.get(fullUrl);
        if (!shared) {
            shared = this.http.get(fullUrl).pipe(
                finalize(() => this.inFlightGets.delete(fullUrl)),
                share({
                    connector: () => new ReplaySubject(1),
                    resetOnComplete: true,
                    resetOnError: true,
                }),
            );
            this.inFlightGets.set(fullUrl, shared);
        }
        return shared;
    }

    post(url: string, requestBody: object): Observable<any> {
        this.dropInFlightGet(url);
        return this.http.post(this.baseUrl + url, requestBody);
    }

    put(url: string, requestBody: object): Observable<any> {
        this.dropInFlightGet(url);
        return this.http.put(this.baseUrl + url, requestBody);
    }

    patch(url: string, requestBody: object): Observable<any> {
        this.dropInFlightGet(url);
        return this.http.patch(this.baseUrl + url, requestBody);
    }

    delete(url: string): Observable<any> {
        this.dropInFlightGet(url);
        return this.http.delete(this.baseUrl + url);
    }

    private dropInFlightGet(url: string): void {
        this.inFlightGets.delete(this.baseUrl + url);
    }
}
