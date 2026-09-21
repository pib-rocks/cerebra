import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {HttpErrorResponse} from "@angular/common/http";
import {DatePipe} from "@angular/common";
import {of, throwError} from "rxjs";
import {UpdateComponent} from "./update.component";
import {
    AvailableUpdates,
    InstalledRevisions,
    UpdateService,
    UpdateStatus,
} from "./update.service";

describe("UpdateComponent", () => {
    let component: UpdateComponent;
    let fixture: ComponentFixture<UpdateComponent>;
    let updateServiceSpy: jasmine.SpyObj<UpdateService>;

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
    const cerebraSha = "0cafe8d7cadcc038f9f4dc855cc3eea2f9d9681a";
    const backendSha = "ce2ec8fd337b76c18174382aac2b12d8222c79bd";
    const availability: AvailableUpdates = {
        checkedAt: "2026-09-21T11:00:00Z",
        repositories: {
            "pib-backend": {
                installed: backendSha,
                target: "333333333333cccccccc",
                updateAvailable: true,
            },
            cerebra: {
                installed: cerebraSha,
                updateAvailable: "unknown",
            },
        },
    };
    const idleStatus: UpdateStatus = {
        state: "idle",
        classification: "idle",
    };
    // Timestamps of the live GET /api/system/update/status document.
    const startedAt = "2026-09-21T13:13:26Z";
    const updatedAt = "2026-09-21T13:21:15.423006+00:00";
    const formatDate = (value: string): string =>
        new DatePipe("en-US").transform(value, "medium") ?? "";

    beforeEach(async () => {
        updateServiceSpy = jasmine.createSpyObj("UpdateService", [
            "getInstalledRevisions",
            "getAvailableUpdates",
            "checkForUpdates",
            "getStatus",
            "getLog",
            "startUpdate",
            "cancelUpdate",
        ]);
        updateServiceSpy.getInstalledRevisions.and.returnValue(of(installed));
        updateServiceSpy.getAvailableUpdates.and.returnValue(of(availability));
        updateServiceSpy.checkForUpdates.and.returnValue(of({}));
        updateServiceSpy.getStatus.and.returnValue(of(idleStatus));
        updateServiceSpy.getLog.and.returnValue(
            of({offset: 0, nextOffset: 4, content: "log\n"}),
        );
        updateServiceSpy.startUpdate.and.returnValue(
            of({
                job: {
                    state: "queued",
                    classification: "queued",
                    jobId: "job-1",
                },
            }),
        );
        updateServiceSpy.cancelUpdate.and.returnValue(
            of({
                status: {
                    state: "cancelled",
                    classification: "failed",
                },
            }),
        );

        await TestBed.configureTestingModule({
            imports: [UpdateComponent],
            providers: [{provide: UpdateService, useValue: updateServiceSpy}],
        }).compileComponents();

        fixture = TestBed.createComponent(UpdateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it("loads and renders installed revisions and availability", () => {
        const compiled = fixture.nativeElement as HTMLElement;

        expect(updateServiceSpy.getInstalledRevisions).toHaveBeenCalled();
        expect(updateServiceSpy.getAvailableUpdates).toHaveBeenCalled();
        expect(compiled.textContent).toContain("v0.6.2");
        expect(compiled.textContent).toContain(backendSha.slice(0, 12));
        expect(compiled.textContent).toContain("Update available");
        expect(compiled.textContent).toContain(
            "Update availability is unknown.",
        );
        expect(compiled.textContent).not.toContain(
            "target revision was not provided",
        );
    });

    it("renders the gitSha of the API document in the revision column and in the result list", fakeAsync(() => {
        const compiled = fixture.nativeElement as HTMLElement;
        const revisionCells = Array.from(
            compiled.querySelectorAll<HTMLElement>(
                "#table-installed-revisions tbody code.revision",
            ),
        );

        expect(revisionCells.map((cell) => cell.textContent?.trim())).toEqual([
            cerebraSha.slice(0, 12),
            backendSha.slice(0, 12),
        ]);
        expect(revisionCells.map((cell) => cell.getAttribute("title"))).toEqual(
            [cerebraSha, backendSha],
        );
        expect(
            compiled.querySelector("#table-installed-revisions")?.textContent,
        ).not.toContain("unknown");

        updateServiceSpy.getStatus.and.returnValue(
            of({
                state: "done",
                classification: "succeeded",
                startedAt,
                updatedAt,
            }),
        );
        component.refreshStatus();
        tick();
        fixture.detectChanges();

        const resultRevisions = Array.from(
            compiled.querySelectorAll<HTMLElement>(
                "#update-result code.revision",
            ),
        );
        expect(resultRevisions.map((cell) => cell.textContent?.trim())).toEqual(
            [cerebraSha.slice(0, 12), backendSha.slice(0, 12)],
        );
        expect(
            compiled.querySelector("#update-result")?.textContent,
        ).not.toContain("unknown");
    }));

    it("renders the timestamps of the status document and 'not reported' for a missing one", fakeAsync(() => {
        const compiled = fixture.nativeElement as HTMLElement;
        const timestampText = (test: string): string =>
            compiled
                .querySelector(`[data-test='${test}']`)
                ?.textContent?.trim() ?? "";

        updateServiceSpy.getStatus.and.returnValue(
            of({
                state: "done",
                classification: "succeeded",
                jobId: "job-42",
                startedAt,
                updatedAt,
            }),
        );
        component.refreshStatus();
        tick();
        fixture.detectChanges();

        expect(timestampText("TXT_Update_Started_At")).toBe(
            formatDate(startedAt),
        );
        expect(timestampText("TXT_Update_Updated_At")).toBe(
            formatDate(updatedAt),
        );
        expect(
            compiled.querySelector("[data-test='TXT_Update_Completed_At']"),
        ).toBeNull();

        updateServiceSpy.getStatus.and.returnValue(
            of({
                state: "failed",
                classification: "failed",
                jobId: "job-43",
                updatedAt,
            }),
        );
        component.refreshStatus();
        tick();
        fixture.detectChanges();

        expect(timestampText("TXT_Update_Started_At")).toBe("not reported");
        expect(timestampText("TXT_Update_Updated_At")).toBe(
            formatDate(updatedAt),
        );
    }));

    it("requires an explicit channel and the exact confirmation token", () => {
        component.channel = "";
        component.confirmation = "UPDATE";
        expect(component.canStart).toBeFalse();

        component.channel = "main";
        component.confirmation = "update";
        expect(component.canStart).toBeFalse();

        component.confirmation = "UPDATE";
        expect(component.canStart).toBeTrue();
    });

    it("starts only on demand with channel, force, and confirmation", () => {
        expect(updateServiceSpy.startUpdate).not.toHaveBeenCalled();

        component.channel = " develop ";
        component.force = true;
        component.confirmation = "UPDATE";
        component.startUpdate();

        expect(updateServiceSpy.startUpdate).toHaveBeenCalledWith({
            channel: "develop",
            force: true,
            confirmation: "UPDATE",
        });
        expect(component.status?.state).toBe("queued");
    });

    it("posts a check before retrieving availability", () => {
        updateServiceSpy.checkForUpdates.calls.reset();
        updateServiceSpy.getAvailableUpdates.calls.reset();

        component.checkForUpdates();

        expect(updateServiceSpy.checkForUpdates).toHaveBeenCalledTimes(1);
        expect(updateServiceSpy.getAvailableUpdates).toHaveBeenCalledTimes(1);
    });

    it("degrades clearly when PR-1813 availability returns 404", () => {
        updateServiceSpy.getAvailableUpdates.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 404,
                        error: {error: "not found"},
                    }),
            ),
        );

        component.loadAvailableUpdates();
        fixture.detectChanges();

        expect(component.availabilityUnavailable).toContain(
            "not available yet (backend story PR-1813)",
        );
        expect(
            (fixture.nativeElement as HTMLElement).querySelector(
                "[data-test='TXT_Availability_Unavailable']",
            ),
        ).toBeTruthy();
    });

    it("shows a repair hint when the update runner returns 503", () => {
        updateServiceSpy.getStatus.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 503,
                        error: {state: "runner_missing"},
                    }),
            ),
        );

        component.refreshStatus();
        fixture.detectChanges();

        expect(component.serviceUnavailable).toContain(
            "update runner is missing",
        );
    });

    it("polls live status and appends logs using nextOffset", fakeAsync(() => {
        const running: UpdateStatus = {
            state: "building",
            classification: "running",
            jobId: "job-2",
            attempt: 1,
            maxAttempts: 3,
        };
        const done: UpdateStatus = {
            ...running,
            state: "done",
            classification: "succeeded",
        };
        updateServiceSpy.getStatus.calls.reset();
        updateServiceSpy.getLog.calls.reset();
        updateServiceSpy.getStatus.and.returnValues(of(running), of(done));
        updateServiceSpy.getLog.and.returnValues(
            of({offset: 0, nextOffset: 5, content: "first"}),
            of({offset: 5, nextOffset: 9, content: "next"}),
        );

        const pollingFixture = TestBed.createComponent(UpdateComponent);
        pollingFixture.detectChanges();
        tick(2000);

        expect(updateServiceSpy.getStatus.calls.count()).toBe(2);
        expect(updateServiceSpy.getLog.calls.argsFor(0)).toEqual([0]);
        expect(updateServiceSpy.getLog.calls.argsFor(1)).toEqual([5]);
        expect(pollingFixture.componentInstance.log).toBe("firstnext");
        expect(pollingFixture.componentInstance.status?.state).toBe("done");

        pollingFixture.destroy();
    }));

    it("stops automatic log polling after an error", fakeAsync(() => {
        const running: UpdateStatus = {
            state: "fetching",
            classification: "running",
        };
        updateServiceSpy.getStatus.and.returnValue(of(running));
        updateServiceSpy.getLog.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 500,
                        error: {error: "log failed"},
                    }),
            ),
        );

        const pollingFixture = TestBed.createComponent(UpdateComponent);
        pollingFixture.detectChanges();
        tick(4000);

        expect(updateServiceSpy.getLog.calls.count()).toBe(1);
        expect(pollingFixture.componentInstance.logError).toBe("log failed");

        pollingFixture.destroy();
    }));

    it("renders failure warnings and cancelled results distinctly", fakeAsync(() => {
        const rolledBack: UpdateStatus = {
            state: "rolled_back",
            classification: "rolled_back",
            message: "verification failed",
            unhealthyServices: ["camera"],
        };
        const cancelled: UpdateStatus = {
            state: "cancelled",
            classification: "failed",
            message: "cancelled by operator",
        };

        updateServiceSpy.getStatus.and.returnValue(of(rolledBack));
        component.refreshStatus();
        tick();
        fixture.detectChanges();

        let compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain(
            "Update failed and was rolled back",
        );
        expect(compiled.textContent).toContain("verification failed");
        expect(compiled.textContent).toContain(
            "already unhealthy before the update do not fail it",
        );

        updateServiceSpy.getStatus.and.returnValue(of(cancelled));
        component.refreshStatus();
        tick();
        fixture.detectChanges();

        compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain("Update cancelled");
        expect(compiled.textContent).toContain("cancelled by operator");
        expect(compiled.querySelector(".result-cancelled")).toBeTruthy();
    }));

    it("states both replacement downtime and force data loss warnings", () => {
        const text = (fixture.nativeElement as HTMLElement).textContent ?? "";

        expect(text).toContain("replaces the running stack");
        expect(text).toContain("running programs to stop");
        expect(text).toContain("git reset --hard");
        expect(text).toContain("git clean -fd");
    });
});
