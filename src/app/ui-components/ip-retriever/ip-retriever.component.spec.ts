import {ComponentFixture, TestBed} from "@angular/core/testing";
import {IpRetrieverComponent} from "./ip-retriever.component";
import {ApiService} from "src/app/shared/services/api.service";
import {of, throwError} from "rxjs";

describe("IpRetrieverComponent", () => {
    let component: IpRetrieverComponent;
    let fixture: ComponentFixture<IpRetrieverComponent>;
    let apiService: jasmine.SpyObj<ApiService>;

    beforeEach(async () => {
        const apiServiceSpy = jasmine.createSpyObj("ApiService", ["get"]);
        const mockIp = "192.168.1.1";
        apiServiceSpy.get.and.returnValue(of({host_ip: mockIp}));
        await TestBed.configureTestingModule({
            declarations: [IpRetrieverComponent],
            providers: [{provide: ApiService, useValue: apiServiceSpy}],
        }).compileComponents();

        fixture = TestBed.createComponent(IpRetrieverComponent);
        component = fixture.componentInstance;
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should display IP if hostIp is set", () => {
        fixture.detectChanges();
        expect(component.hostIp).toBe("192.168.1.1");
    });

    it("should throw error", () => {
        apiService.get.and.returnValue(
            throwError(() => ({status: 500, message: "Internal Server Error"})),
        );

        fixture.detectChanges();
        expect(component.hostIp).toBe("");
    });
});
