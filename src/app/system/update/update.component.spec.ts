import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {HttpErrorResponse} from "@angular/common/http";
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

    const installed: InstalledRevisions = {
        imageVersion: "v1.2.3",
        repositories: {
            "pib-backend": {
                revision: "111111111111aaaaaaaa",
                channel: "main",
                buildTime: "2026-09-21T10:00:00Z",
            },
            cerebra: {
                revision: "222222222222bbbbbbbb",
                channel: "main",
                buildTime: "2026-09-21T10:01:00Z",
            },
        },
    };
    const availability: AvailableUpdates = {
        checkedAt: "2026-09-21T11:00:00Z",
        repositories: {
            "pib-backend": {
                installed: "111111111111aaaaaaaa",
                target: "333333333333cccccccc",
                updateAvailable: true,
            },
            cerebra: {
                installed: "222222222222bbbbbbbb",
                updateAvailable: "unknown",
            },
        },
    };
    const idleStatus: UpdateStatus = {
        state: "idle",
        classification: "idle",
    };

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
        expect(compiled.textContent).toContain("v1.2.3");
        expect(compiled.textContent).toContain("111111111111");
        expect(compiled.textContent).toContain("Update available");
        expect(compiled.textContent).toContain(
            "Update availability is unknown.",
        );
        expect(compiled.textContent).not.toContain(
            "target revision was not provided",
        );
    });

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
