import {TestBed} from "@angular/core/testing";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";

import {ApiService} from "./api.service";

describe("ApiService", () => {
    let service: ApiService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(ApiService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("coalesces two identical GET calls in quick succession into one HttpClient request", () => {
        const path = "/voice-assistant/chat/1/messages";
        let first: unknown;
        let second: unknown;

        service.get(path).subscribe((body) => (first = body));
        service.get(path).subscribe((body) => (second = body));

        const req = http.expectOne(`${service.baseUrl}${path}`);
        expect(req.request.method).toBe("GET");
        req.flush({messages: []});

        expect(first).toEqual({messages: []});
        expect(second).toEqual({messages: []});
    });

    it("does not coalesce GET requests to different URLs", () => {
        service.get("/a").subscribe();
        service.get("/b").subscribe();

        const reqA = http.expectOne(`${service.baseUrl}/a`);
        const reqB = http.expectOne(`${service.baseUrl}/b`);
        expect(reqA.request.method).toBe("GET");
        expect(reqB.request.method).toBe("GET");
    });

    it("issues a fresh GET after a mutating call for the same URL", () => {
        const path = "/voice-assistant/chat/1/messages";

        service.get(path).subscribe();
        http.expectOne(`${service.baseUrl}${path}`).flush({messages: []});

        service.post(path, {text: "hi"}).subscribe();
        http.expectOne(`${service.baseUrl}${path}`).flush({ok: true});

        service.get(path).subscribe();
        const retryReq = http.expectOne(`${service.baseUrl}${path}`);
        expect(retryReq.request.method).toBe("GET");
        retryReq.flush({messages: [{id: 1}]});
    });

    it("delivers errors to every coalesced subscriber and allows a retry", () => {
        const path = "/voice-assistant/chat/1/messages";
        const errors: unknown[] = [];

        service.get(path).subscribe({
            error: (err) => errors.push(err),
        });
        service.get(path).subscribe({
            error: (err) => errors.push(err),
        });

        const req = http.expectOne(`${service.baseUrl}${path}`);
        req.flush("failed", {
            status: 500,
            statusText: "Server Error",
        });

        expect(errors.length).toBe(2);

        let retryBody: unknown;
        service.get(path).subscribe((body) => (retryBody = body));
        http.expectOne(`${service.baseUrl}${path}`).flush({
            messages: ["retry"],
        });

        expect(retryBody).toEqual({messages: ["retry"]});
    });
});
