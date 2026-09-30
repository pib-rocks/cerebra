import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";

export interface KeyStoreStatus {
    encryptKeyStorage: boolean;
    credentialRefs: string[];
}

export interface KeyStoreWriteResult {
    successful: boolean;
    credentialRef?: string;
    error?: string;
}

@Injectable({
    providedIn: "root",
})
export class KeyStoreService {
    constructor(
        private readonly apiService: ApiService,
        private readonly http: HttpClient,
    ) {}

    status(): Observable<KeyStoreStatus> {
        return this.apiService.get(UrlConstants.KEY_STORE);
    }

    putSecret(
        providerId: number,
        password: string,
        secret: string,
    ): Observable<KeyStoreWriteResult> {
        return this.apiService.put(`${UrlConstants.KEY_STORE}/${providerId}`, {
            password,
            secret,
        });
    }

    deleteSecret(providerId: number, password: string): Observable<string> {
        return this.http.delete(
            `${this.apiService.baseUrl}${UrlConstants.KEY_STORE}/${providerId}`,
            {
                body: {password},
                responseType: "text",
            },
        );
    }

    changePassword(
        oldPassword: string,
        newPassword: string,
        confirmPassword: string,
    ): Observable<KeyStoreWriteResult> {
        return this.apiService.post(`${UrlConstants.KEY_STORE}/password`, {
            oldPassword,
            newPassword,
            confirmPassword,
        });
    }
}

export function keyStoreErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
        const body = err.error;
        if (typeof body === "string" && body !== "") {
            try {
                const parsed = JSON.parse(body) as {error?: string};
                if (typeof parsed.error === "string" && parsed.error !== "") {
                    return parsed.error;
                }
            } catch {
                return body;
            }
        }
        if (
            body != null &&
            typeof body === "object" &&
            "error" in body &&
            typeof body.error === "string" &&
            body.error !== ""
        ) {
            return body.error;
        }
    }
    if (err instanceof Error && err.message !== "") {
        return err.message;
    }
    return "Key store request failed.";
}
