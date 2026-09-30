import {TestBed} from "@angular/core/testing";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import {ChannelCapabilityService} from "./channel-capability.service";
import {UrlConstants} from "./url.constants";

describe("ChannelCapabilityService", () => {
    let service: ChannelCapabilityService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(ChannelCapabilityService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
    });

    it("keeps Smart available when the installer endpoint is missing", () => {
        http.expectOne("/api" + UrlConstants.CHAT_CHANNEL).flush("missing", {
            status: 404,
            statusText: "Not Found",
        });
        expect(service.smartChatsEnabled).toBeTrue();
    });

    it("hides Smart only when the installer reports the channel disabled", () => {
        http.expectOne("/api" + UrlConstants.CHAT_CHANNEL).flush({
            smartChatsEnabled: false,
        });
        expect(service.smartChatsEnabled).toBeFalse();
    });
});
