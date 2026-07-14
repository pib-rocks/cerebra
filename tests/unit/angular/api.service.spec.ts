import {TestBed} from "@angular/core/testing";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import {ApiService} from "src/app/shared/services/api.service";

describe("ApiService", () => {
    let service: ApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ApiService],
        });
        service = TestBed.inject(ApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("uses /api as baseUrl for GET requests", () => {
        service.get("/program").subscribe();
        const req = httpMock.expectOne("/api/program");
        expect(req.request.method).toBe("GET");
        req.flush({programs: []});
    });

    it("uses /api as baseUrl for POST requests with JSON body", () => {
        const body = {name: "Test Program"};
        service.post("/program", body).subscribe();
        const req = httpMock.expectOne("/api/program");
        expect(req.request.method).toBe("POST");
        expect(req.request.body).toEqual(body);
        req.flush({name: "Test Program", programNumber: "1"});
    });

    it("uses /api as baseUrl for PUT /program/{n}/code", () => {
        const body = {codeVisual: "{}"};
        service.put("/program/1/code", body).subscribe();
        const req = httpMock.expectOne("/api/program/1/code");
        expect(req.request.method).toBe("PUT");
        expect(req.request.body).toEqual(body);
        req.flush(body);
    });

    it("uses /api as baseUrl for PATCH /pose/{id}", () => {
        const body = {name: "New Name"};
        service.patch("/pose/pose-abc", body).subscribe();
        const req = httpMock.expectOne("/api/pose/pose-abc");
        expect(req.request.method).toBe("PATCH");
        expect(req.request.body).toEqual(body);
        req.flush({});
    });

    it("uses /api as baseUrl for DELETE requests", () => {
        service.delete("/program/42").subscribe();
        const req = httpMock.expectOne("/api/program/42");
        expect(req.request.method).toBe("DELETE");
        req.flush(null);
    });
});
