import {TestBed} from "@angular/core/testing";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import {IpService} from "./ip.service";
import {UrlConstants} from "./url.constants";

describe("IpService", () => {
    let service: IpService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [IpService],
        });
        service = TestBed.inject(IpService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should get host IP", () => {
        const mockIp = "192.168.0.1";
        service.getHostIp().subscribe((ip) => {
            expect(ip).toBe(mockIp);
        });

        const req = httpMock.expectOne(UrlConstants.HOST_IP);
        expect(req.request.method).toBe("GET");
        req.flush(mockIp);
    });
    it("should set host IP", () => {
        const newIp = "192.168.0.2";
        service.setHostIp(newIp).subscribe(() => {
            // Expect no response body
        });

        const req = httpMock.expectOne(UrlConstants.HOST_IP);
        expect(req.request.method).toBe("POST");
        expect(req.request.body).toEqual({ip: newIp});
        req.flush(null);
    });
});
