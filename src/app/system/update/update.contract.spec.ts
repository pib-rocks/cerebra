import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {HttpErrorResponse} from "@angular/common/http";
import {of, throwError} from "rxjs";
import {UpdateComponent} from "./update.component";
import {UpdateService} from "./update.service";

/**
 * Regression for the live POST /system/update document: job has no state.
 * Applying response.job leaves the page idle and does not schedule polling.
 */
describe("UpdateComponent operator contract", () => {
    let fixture: ComponentFixture<UpdateComponent>;
    let component: UpdateComponent;
    let updateServiceSpy: jasmine.SpyObj<UpdateService>;

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
        updateServiceSpy.getInstalledRevisions.and.returnValue(
            of({imageVersion: "v0.6.2", repositories: {}}),
        );
        updateServiceSpy.getAvailableUpdates.and.returnValue(
            of({
                checkedAt: "2026-10-10T00:00:00Z",
                checkId: "check-1",
                state: "completed",
                channel: "release",
                repositories: {},
                recommendation: {
                    tag: "v1.2.3",
                    relation: "newer",
                    installable: true,
                    ordinaryUpdate: true,
                    notes: "fixture",
                },
            } as any),
        );
        updateServiceSpy.checkForUpdates.and.returnValue(of({} as any));
        updateServiceSpy.getStatus.and.returnValue(
            of({
                state: "idle",
                classification: "idle",
                readiness: {ready: true, checks: []},
            }),
        );
        updateServiceSpy.getLog.and.returnValue(
            of({offset: 0, nextOffset: 0, content: ""}),
        );
        updateServiceSpy.startUpdate.and.returnValue(
            of({
                job: {
                    schemaVersion: 1,
                    jobId: "job-real",
                    requestedAt: "2026-10-10T00:00:00Z",
                    actor: "test",
                    channel: "release",
                    force: false,
                    confirmation: "UPDATE",
                    release: "v1.2.3",
                    targetKind: "published-release",
                    targets: {
                        "pib-backend": "a".repeat(40),
                        cerebra: "b".repeat(40),
                    },
                },
                status: {
                    state: "queued",
                    classification: "queued",
                    jobId: "job-real",
                },
            } as any),
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
        sessionStorage.removeItem("pib.update.jobId");
        fixture.destroy();
    });

    it("adopts the separate status and polls when the job itself has no state", fakeAsync(() => {
        updateServiceSpy.getStatus.calls.reset();
        component.channel = "release";
        component.confirmation = "UPDATE";
        component.availability = {
            checkedAt: "2026-10-10T00:00:00Z",
            checkId: "check-1",
            state: "completed",
            repositories: {},
            recommendation: {
                tag: "v1.2.3",
                relation: "newer",
                installable: true,
                ordinaryUpdate: true,
            },
        } as any;
        component.status = {
            state: "idle",
            classification: "idle",
            readiness: {ready: true, checks: []},
        } as any;

        expect(component.canStart).toBeTrue();
        component.startUpdate();

        expect(component.status?.state).toBe("queued");
        expect(component.status?.jobId).toBe("job-real");
        expect(component.isActive).toBeTrue();
        tick(2000);
        expect(updateServiceSpy.getStatus).toHaveBeenCalled();
    }));

    it("treats an HTTP outage during restart as maintenance and then resumes", fakeAsync(() => {
        const running = {
            state: "restarting",
            classification: "running",
            jobId: "job-maintain",
        };
        updateServiceSpy.getStatus.and.returnValues(
            of(running),
            throwError(() => new HttpErrorResponse({status: 0})),
            of({...running, state: "verifying"}),
        );
        updateServiceSpy.getStatus.calls.reset();

        const outage = TestBed.createComponent(UpdateComponent);
        outage.detectChanges();
        tick(2000);
        expect(outage.componentInstance.maintenanceMessage).toContain(
            "Reconnecting",
        );
        expect(outage.componentInstance.isTerminal).toBeFalse();
        tick(2000);
        expect(outage.componentInstance.status?.state).toBe("verifying");
        expect(outage.componentInstance.maintenanceMessage).toBeNull();
        outage.destroy();
    }));
});
