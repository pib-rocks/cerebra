import {TestBed} from "@angular/core/testing";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import {KeyStoreService, keyStoreErrorMessage} from "./key-store.service";
import {HttpErrorResponse} from "@angular/common/http";

describe("KeyStoreService", () => {
    let service: KeyStoreService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(KeyStoreService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
    });

    it("reads encryption state and credential refs without secrets", () => {
        let body: unknown;
        service.status().subscribe((status) => {
            body = status;
        });
        const req = http.expectOne("/api/system/key-store");
        expect(req.request.method).toBe("GET");
        req.flush({
            encryptKeyStorage: true,
            credentialRefs: ["provider-2"],
        });
        expect(body).toEqual({
            encryptKeyStorage: true,
            credentialRefs: ["provider-2"],
        });
        expect(JSON.stringify(body)).not.toContain("sk-");
    });

    it("stores a secret and returns only the credential ref", () => {
        let body: unknown;
        service
            .putSecret(4, "operator-secret", "sk-live")
            .subscribe((result) => {
                body = result;
            });
        const req = http.expectOne("/api/system/key-store/4");
        expect(req.request.method).toBe("PUT");
        expect(req.request.body).toEqual({
            password: "operator-secret",
            secret: "sk-live",
        });
        req.flush({successful: true, credentialRef: "provider-4"});
        expect(body).toEqual({
            successful: true,
            credentialRef: "provider-4",
        });
        expect(JSON.stringify(body)).not.toContain("sk-live");
    });

    it("sends the operator password when a key is deleted", () => {
        let completed = false;
        service.deleteSecret(4, "operator-secret").subscribe(() => {
            completed = true;
        });
        const req = http.expectOne("/api/system/key-store/4");
        expect(req.request.method).toBe("DELETE");
        expect(req.request.body).toEqual({password: "operator-secret"});
        req.flush("", {status: 204, statusText: "No Content"});
        expect(completed).toBeTrue();
    });

    it("unlocks the store with the operator password and returns no secrets", () => {
        let body: unknown;
        service.unlock("operator-secret").subscribe((result) => {
            body = result;
        });
        const req = http.expectOne("/api/system/key-store/unlock");
        expect(req.request.method).toBe("POST");
        expect(req.request.body).toEqual({password: "operator-secret"});
        req.flush({
            successful: true,
            credentials: [{credentialRef: "provider-4"}],
        });
        expect(body).toEqual({
            successful: true,
            credentials: [{credentialRef: "provider-4"}],
        });
        expect(JSON.stringify(body)).not.toContain("sk-");
    });

    it("reads the key-store error message", () => {
        const response = new HttpErrorResponse({
            status: 401,
            error: {error: "Wrong password. No keys are available."},
        });
        expect(keyStoreErrorMessage(response)).toBe(
            "Wrong password. No keys are available.",
        );
    });
});
