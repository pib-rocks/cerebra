import {TestBed} from "@angular/core/testing";
import {of} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {
    AvailableUpdates,
    InstalledRevisions,
    UpdateService,
    UpdateStatus,
} from "./update.service";

describe("UpdateService", () => {
    let service: UpdateService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    const installed: InstalledRevisions = {
        imageVersion: "v1.2.3",
        repositories: {
            cerebra: {
                revision: "1234567890abcdef",
                channel: "main",
                buildTime: "2026-09-21T10:00:00Z",
            },
        },
    };
    const status: UpdateStatus = {
        state: "building",
        classification: "running",
        jobId: "job-1",
    };
    const availability: AvailableUpdates = {
        checkedAt: "2026-09-21T10:00:00Z",
        repositories: {
            cerebra: {
                installed: "1234",
                target: "5678",
                updateAvailable: true,
            },
        },
    };

    beforeEach(() => {
        apiServiceSpy = jasmine.createSpyObj("ApiService", ["get", "post"]);
        apiServiceSpy.get.and.returnValue(of({}));
        apiServiceSpy.post.and.returnValue(of({}));

        TestBed.configureTestingModule({
            providers: [
                UpdateService,
                {provide: ApiService, useValue: apiServiceSpy},
            ],
        });
        service = TestBed.inject(UpdateService);
    });

    it("loads installed revisions and current status through ApiService", () => {
        apiServiceSpy.get.and.returnValues(of(installed), of(status));

        service.getInstalledRevisions().subscribe();
        service.getStatus().subscribe();

        expect(apiServiceSpy.get.calls.argsFor(0)).toEqual([
            UrlConstants.SYSTEM_REVISION,
        ]);
        expect(apiServiceSpy.get.calls.argsFor(1)).toEqual([
            UrlConstants.SYSTEM_UPDATE_STATUS,
        ]);
    });

    it("polls the log with the supplied offset", () => {
        service.getLog(42).subscribe();

        expect(apiServiceSpy.get).toHaveBeenCalledWith(
            `${UrlConstants.SYSTEM_UPDATE_LOG}?offset=42`,
        );
    });

    it("starts an update with channel, force, and typed confirmation", () => {
        const request = {
            channel: "develop",
            force: true,
            confirmation: "UPDATE" as const,
        };

        service.startUpdate(request).subscribe();

        expect(apiServiceSpy.post).toHaveBeenCalledWith(
            UrlConstants.SYSTEM_UPDATE,
            request,
        );
    });

    it("uses the cancel endpoint without extra request data", () => {
        service.cancelUpdate().subscribe();

        expect(apiServiceSpy.post).toHaveBeenCalledWith(
            UrlConstants.SYSTEM_UPDATE_CANCEL,
            {},
        );
    });

    it("checks availability and then retrieves its result", () => {
        apiServiceSpy.get.and.returnValue(of(availability));

        service.checkForUpdates().subscribe();
        service.getAvailableUpdates().subscribe();

        expect(apiServiceSpy.post).toHaveBeenCalledWith(
            UrlConstants.SYSTEM_UPDATE_CHECK,
            {},
        );
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
            UrlConstants.SYSTEM_UPDATE_AVAILABLE,
        );
    });
});
