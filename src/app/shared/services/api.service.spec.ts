import {TestBed} from "@angular/core/testing";
import {ApiService} from "./api.service";
import {HttpClient, HttpHandler} from "@angular/common/http";

describe("ApiService", () => {
    let service: ApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [HttpClient, HttpHandler],
        }).compileComponents();

        service = TestBed.inject(ApiService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
