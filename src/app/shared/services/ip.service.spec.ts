import {TestBed} from "@angular/core/testing";
import {IpService} from "./ip.service";
import {ApiService} from "./api.service";
import {of} from "rxjs";

describe("IpService", () => {
    let ipService: IpService;
    let apiService: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const apiServiceSpy = jasmine.createSpyObj("ApiService", ["get"]);
        TestBed.configureTestingModule({
            providers: [
                IpService,
                {provide: ApiService, useValue: apiServiceSpy},
            ],
        });
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        ipService = TestBed.inject(IpService);
    });

    it("should be created", () => {
        expect(ipService).toBeTruthy();
    });

    it("should return host_ip from ApiService", (done) => {
        const mockIp = "192.168.1.1";
        apiService.get.and.returnValue(of({host_ip: mockIp}));

        ipService.getHostIp().subscribe((ip) => {
            expect(ip).toBe(mockIp);
            expect(apiService.get).toHaveBeenCalledWith(jasmine.any(String));
            done();
        });
    });
});
