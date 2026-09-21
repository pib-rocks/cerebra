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

    // Copy of the live GET /api/system/revision document (192.168.1.217, 2026-09-21).
    const installed: InstalledRevisions = {
        imageVersion: "v0.6.2",
        repositories: {
            cerebra: {
                buildTime: "2026-09-21T13:21:15.376559+00:00",
                channel: "develop",
                gitSha: "0cafe8d7cadcc038f9f4dc855cc3eea2f9d9681a",
                repository: "cerebra",
            },
            "pib-backend": {
                buildTime: "2026-09-21T13:21:15.332111+00:00",
                channel: "develop",
                gitSha: "ce2ec8fd337b76c18174382aac2b12d8222c79bd",
                repository: "pib-backend",
            },
        },
    };
    const status: UpdateStatus = {
        state: "building",
        classification: "running",
        jobId: "job-1",
        startedAt: "2026-09-21T13:13:26Z",
        updatedAt: "2026-09-21T13:21:15.423006+00:00",
    };
    const availability: AvailableUpdates = {
        checkedAt: "2026-09-21T10:00:00Z",
        repositories: {
            cerebra: {
                installed: "0cafe8d7cadcc038f9f4dc855cc3eea2f9d9681a",
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
        let receivedRevisions: InstalledRevisions | undefined;
        let receivedStatus: UpdateStatus | undefined;

        service
            .getInstalledRevisions()
            .subscribe((value) => (receivedRevisions = value));
        service.getStatus().subscribe((value) => (receivedStatus = value));

        expect(apiServiceSpy.get.calls.argsFor(0)).toEqual([
            UrlConstants.SYSTEM_REVISION,
        ]);
        expect(apiServiceSpy.get.calls.argsFor(1)).toEqual([
            UrlConstants.SYSTEM_UPDATE_STATUS,
        ]);
        expect(receivedRevisions?.repositories["cerebra"].gitSha).toBe(
            "0cafe8d7cadcc038f9f4dc855cc3eea2f9d9681a",
        );
        expect(receivedStatus?.startedAt).toBe("2026-09-21T13:13:26Z");
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
