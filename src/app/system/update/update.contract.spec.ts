import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {HttpErrorResponse} from "@angular/common/http";
import {of, Subject, throwError} from "rxjs";
import {UpdateComponent} from "./update.component";
import {
    AvailableUpdates,
    UpdateCheckJob,
    UpdateJobResponse,
    UpdateService,
    UpdateStatus,
} from "./update.service";

/**
 * Regression for the live POST /system/update document: job has no state.
 * Applying response.job leaves the page idle and does not schedule polling.
 */
describe("UpdateComponent operator contract", () => {
    let fixture: ComponentFixture<UpdateComponent>;
    let component: UpdateComponent;
    let updateServiceSpy: jasmine.SpyObj<UpdateService>;

    const ready: UpdateStatus = {
        state: "idle",
        classification: "idle",
        readiness: {ready: true, checks: []},
    };
    const release: AvailableUpdates = {
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
            notes: "Published release notes",
        },
    };
    const check: UpdateCheckJob = {
        schemaVersion: 1,
        checkId: "check-new",
        channel: "release",
        requestedAt: "2026-10-10T00:00:00Z",
        actor: "test",
    };
    const running: UpdateStatus = {
        state: "restarting",
        classification: "running",
        jobId: "job-running",
    };
    const fail = (status: number, error?: object) =>
        throwError(() => new HttpErrorResponse({status, error}));
    const enableRelease = () => {
        component.status = ready;
        component.availability = release;
        component.confirmation = "UPDATE";
    };
    const render = (selector: string): string => {
        fixture.detectChanges();
        return (
            (fixture.nativeElement as HTMLElement).querySelector(selector)
                ?.textContent ?? ""
        );
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

    it("defaults to a finite release/develop selector and pins the recommended release", () => {
        enableRelease();
        fixture.detectChanges();
        const select = (fixture.nativeElement as HTMLElement).querySelector(
            "[data-test='INP_Update_Channel']",
        ) as HTMLSelectElement;
        expect(select.tagName).toBe("SELECT");
        expect(Array.from(select.options, (option) => option.value)).toEqual([
            "release",
            "develop",
        ]);
        expect(component.channel).toBe("release");
        component.startUpdate();
        expect(updateServiceSpy.startUpdate).toHaveBeenCalledOnceWith({
            channel: "release",
            force: false,
            confirmation: "UPDATE",
            release: "v1.2.3",
            checkId: "check-1",
        });
        expect(sessionStorage.getItem(component.jobStorageKey)).toBe(
            "job-real",
        );
        expect(component.actionError).toBeNull();
    });

    it("blocks unknown status, unreported readiness, and in-flight installs without posting", () => {
        enableRelease();
        component.status = null;
        component.statusLoading = true;
        expect(component.installBlocker).toBe(
            "Update status is still unknown.",
        );
        component.statusLoading = false;
        expect(component.installBlocker).toBe("Update status is unknown.");
        component.status = {state: "idle"};
        expect(component.installBlocker).toBe(
            "Updater readiness has not been reported.",
        );
        component.status = ready;
        component.starting = true;
        expect(component.installBlocker).toBe(
            "An update is already in progress.",
        );
        component.startUpdate();
        expect(updateServiceSpy.startUpdate).not.toHaveBeenCalled();
    });

    it("renders missing and failed readiness repairs and excludes successful checks", () => {
        enableRelease();
        updateServiceSpy.getStatus.and.returnValue(
            of({
                ...ready,
                readiness: {
                    ready: false,
                    checks: [
                        {
                            name: "runner",
                            status: "missing",
                            detail: "Runner missing.",
                            repair: "Install runner.",
                        },
                        {
                            name: "unit",
                            status: "failed",
                            detail: "Unit failed.",
                        },
                        {
                            name: "marker",
                            status: "ok",
                            detail: "Marker present.",
                        },
                    ],
                },
            }),
        );
        component.refreshStatus();
        expect(component.readinessMessage).toBe(
            "Runner missing. Install runner. Unit failed.",
        );
        expect(render("[data-test='TXT_Update_Readiness']")).toContain(
            "Install runner.",
        );
        expect(component.canStart).toBeFalse();
        component.startUpdate();
        expect(updateServiceSpy.startUpdate).not.toHaveBeenCalled();
        component.status = {...ready, readiness: {ready: false, checks: []}};
        expect(component.installBlocker).toBe(
            "Updater readiness is not confirmed.",
        );
    });

    it("requires exact confirmation and rejects unsupported channels for both actions", () => {
        enableRelease();
        for (const token of ["", "update", " UPDATE", "UPDATE "]) {
            component.confirmation = token;
            expect(component.installBlocker).toBe("Type UPDATE to confirm.");
            component.startUpdate();
        }
        component.confirmation = "UPDATE";
        component.channel = "main";
        expect(component.installBlocker).toBe(
            "Channel must be release or develop.",
        );
        component.startUpdate();
        component.checkForUpdates();
        expect(component.availabilityError).toBe(
            "Channel must be release or develop.",
        );
        expect(updateServiceSpy.startUpdate).not.toHaveBeenCalled();
        expect(updateServiceSpy.checkForUpdates).not.toHaveBeenCalled();
    });

    it("never starts an absent, un-installable, or already installed release", () => {
        enableRelease();
        component.availability = null;
        expect(component.ordinaryUpdate).toBeFalse();
        expect(component.installBlocker).toBe(
            "No installable published release is selected.",
        );
        component.startUpdate();
        component.availability = {
            ...release,
            recommendation: {...release.recommendation!, installable: false},
        };
        expect(component.canStart).toBeFalse();
        component.startUpdate();
        component.availability = {
            ...release,
            recommendation: {...release.recommendation!, relation: "current"},
        };
        expect(component.installBlocker).toBe(
            "That published release is already installed.",
        );
        component.acknowledgeException = true;
        component.startUpdate();
        expect(updateServiceSpy.startUpdate).not.toHaveBeenCalled();
    });

    for (const relation of ["older", "channel-change", "drift"]) {
        it(`requires expert acknowledgement for a ${relation} release and pins the chosen tag`, () => {
            enableRelease();
            component.availability = {
                ...release,
                releases: [
                    {
                        tag: "v1.1.0",
                        relation,
                        installable: true,
                        notes: "Chosen notes",
                    },
                ],
            };
            component.chosenTag = "v1.1.0";
            expect(component.ordinaryUpdate).toBeFalse();
            expect(component.installBlocker).toContain(
                "Confirm it under Details / Expert",
            );
            component.startUpdate();
            expect(updateServiceSpy.startUpdate).not.toHaveBeenCalled();
            component.acknowledgeException = true;
            expect(component.canStart).toBeTrue();
            expect(component.releaseNotes).toBe("Chosen notes");
            component.startUpdate();
            expect(
                updateServiceSpy.startUpdate.calls.mostRecent().args[0],
            ).toEqual({
                channel: "release",
                force: false,
                confirmation: "UPDATE",
                release: "v1.1.0",
                checkId: "check-1",
            });
        });
    }

    it("uses selected published-pair metadata, not the recommendation, and handles missing notes", () => {
        enableRelease();
        component.availability = {
            ...release,
            releases: [
                {
                    tag: "v2.0.0",
                    relation: "newer",
                    installable: true,
                    notes: "   ",
                },
            ],
        };
        component.chosenTag = "v2.0.0";
        expect(component.ordinaryUpdate).toBeTrue();
        expect(component.canStart).toBeTrue();
        expect(component.releaseNotes).toBe("No release notes were reported.");
        component.chosenTag = "nonexistent";
        expect(component.selectedRelease).toBeNull();
        expect(component.canStart).toBeFalse();
        component.chosenTag = "";
        expect(component.releaseNotes).toBe("Published release notes");
        component.availability = null;
        expect(component.selectedRelease).toBeNull();
        expect(component.releaseNotes).toBe("No release notes were reported.");
    });

    it("explains each release relation without presenting unknown versions as newer", () => {
        expect(component.relationText("newer")).toBe("Newer published release");
        expect(component.relationText("current")).toBe("Already installed");
        expect(component.relationText("older")).toBe(
            "Older than the installed release",
        );
        expect(component.relationText("channel-change")).toContain(
            "Leaves the development build",
        );
        expect(component.relationText("drift")).toContain(
            "installed commits differ",
        );
        expect(component.relationText(undefined)).toBe(
            "Relation to the installed version is unknown",
        );
    });

    it("uses reported device channel and otherwise distinguishes unknown, uniform, and mixed revisions", () => {
        component.availability = {...release, deviceChannel: "develop"};
        expect(component.deviceChannel).toBe("develop");
        component.availability = null;
        component.installed = null;
        expect(component.installedRepositories).toEqual([]);
        expect(component.availableRepositories).toEqual([]);
        expect(component.deviceChannel).toBe("unknown");
        component.installed = {
            repositories: {
                cerebra: {gitSha: "", channel: "unknown"},
                "pib-backend": {gitSha: ""},
            },
        };
        expect(component.deviceChannel).toBe("unknown");
        component.installed = {
            repositories: {
                cerebra: {gitSha: "", channel: "release"},
                "pib-backend": {gitSha: "", channel: "release"},
            },
        };
        expect(component.deviceChannel).toBe("release");
        component.installed = {
            repositories: {
                cerebra: {gitSha: "", channel: "release"},
                "pib-backend": {gitSha: "", channel: "develop"},
            },
        };
        expect(component.deviceChannel).toBe("mixed");
    });

    it("requires two valid develop commit pins and acknowledgement before posting", () => {
        enableRelease();
        component.channel = "develop";
        for (const target of [undefined, "abc", "G".repeat(40)]) {
            component.availability = {
                ...release,
                repositories: {
                    "pib-backend": {
                        installed: "",
                        updateAvailable: true,
                        target: "a".repeat(40),
                    },
                    cerebra: {
                        installed: "",
                        updateAvailable: "unknown",
                        target,
                    },
                },
            };
            expect(component.developPinned).toBeFalse();
            expect(component.installBlocker).toContain("not pinned both");
            component.startUpdate();
        }
        component.availability = {
            ...release,
            channel: "develop",
            repositories: {
                "pib-backend": {
                    installed: "",
                    updateAvailable: true,
                    target: "a".repeat(40),
                },
                cerebra: {
                    installed: "",
                    updateAvailable: true,
                    target: "b".repeat(40),
                },
            },
        };
        expect(component.developPinned).toBeTrue();
        expect(component.installBlocker).toContain(
            "confirmed as an expert action",
        );
        component.startUpdate();
        expect(updateServiceSpy.startUpdate).not.toHaveBeenCalled();
        component.acknowledgeException = true;
        component.startUpdate();
        expect(updateServiceSpy.startUpdate).toHaveBeenCalledOnceWith({
            channel: "develop",
            force: false,
            confirmation: "UPDATE",
            pin: true,
            checkId: "check-1",
        });
    });

    it("automatically requests availability when no check timestamp exists", fakeAsync(() => {
        updateServiceSpy.checkForUpdates.and.returnValue(of(check));
        updateServiceSpy.getAvailableUpdates.and.returnValues(
            of({repositories: {}}),
            of({...release, checkId: check.checkId}),
        );
        component.loadAvailableUpdates();
        expect(updateServiceSpy.checkForUpdates).toHaveBeenCalledOnceWith(
            "release",
        );
        expect(component.availability?.checkId).toBe(check.checkId);
        expect(component.availabilityLoading).toBeFalse();
        component.status = running;
        updateServiceSpy.getAvailableUpdates.and.returnValue(
            of({repositories: {}}),
        );
        component.loadAvailableUpdates();
        expect(updateServiceSpy.checkForUpdates.calls.count()).toBe(1);
    }));

    it("keeps the previous result through pending documents until the correlated check completes", fakeAsync(() => {
        component.availability = release;
        updateServiceSpy.checkForUpdates.and.returnValue(of(check));
        updateServiceSpy.getAvailableUpdates.and.returnValues(
            of({
                repositories: {},
                state: "pending",
                checkId: check.checkId,
                previous: release,
            }),
            of({repositories: {}, state: "pending", checkId: check.checkId}),
            of({...release, checkId: check.checkId}),
        );
        updateServiceSpy.getAvailableUpdates.calls.reset();
        component.checkForUpdates();
        expect(component.pendingCheckLabel).toBe(check.checkId);
        expect(component.previousAvailability).toBe(release);
        expect(component.availability).toBe(release);
        expect(render(".card:has(#btn-check-updates)")).toContain(
            check.checkId,
        );
        tick(2000);
        expect(component.previousAvailability).toBe(release);
        expect(component.availabilityLoading).toBeTrue();
        tick(2000);
        expect(component.availability?.checkId).toBe(check.checkId);
        expect(component.pendingCheckLabel).toBe("unknown");
        expect(component.availabilityLoading).toBeFalse();
        tick(10000);
        expect(updateServiceSpy.getAvailableUpdates.calls.count()).toBe(3);
    }));

    for (const error of [undefined, "Remote tag fetch failed"]) {
        it(`preserves the last usable result when the matching check fails (${
            error ?? "fallback"
        })`, () => {
            component.availability = release;
            updateServiceSpy.checkForUpdates.and.returnValue(of(check));
            updateServiceSpy.getAvailableUpdates.and.returnValue(
                of({
                    repositories: {},
                    checkId: check.checkId,
                    state: "failed",
                    error,
                }),
            );
            component.checkForUpdates();
            expect(component.availability).toBe(release);
            expect(component.availabilityLoading).toBeFalse();
            expect(component.pendingCheckLabel).toBe("unknown");
            expect(component.availabilityError).toBe(
                error ??
                    "The availability check failed. The previous result was kept.",
            );
        });
    }

    it("retries transient availability HTTP failures and times out without adopting old results", fakeAsync(() => {
        component.availability = release;
        updateServiceSpy.checkForUpdates.and.returnValue(of(check));
        updateServiceSpy.getAvailableUpdates.and.returnValue(fail(0));
        updateServiceSpy.getAvailableUpdates.calls.reset();
        component.checkForUpdates();
        expect(component.availabilityLoading).toBeTrue();
        expect(component.availabilityError).toBeNull();
        tick(120000);
        expect(updateServiceSpy.getAvailableUpdates.calls.count()).toBe(61);
        expect(component.availabilityLoading).toBeFalse();
        expect(component.availability).toBe(release);
        expect(component.availabilityError).toContain("timed out");
        expect(component.pendingCheckLabel).toBe("unknown");
        tick(10000);
        expect(updateServiceSpy.getAvailableUpdates.calls.count()).toBe(61);
    }));

    it("times out a permanently pending document and destroys pending check timers", fakeAsync(() => {
        component.availability = release;
        updateServiceSpy.checkForUpdates.and.returnValue(of(check));
        updateServiceSpy.getAvailableUpdates.and.returnValue(
            of({
                repositories: {},
                checkId: check.checkId,
                state: "pending",
                previous: release,
            }),
        );
        component.checkForUpdates();
        tick(120000);
        expect(component.availabilityError).toContain(
            "not the result of this check",
        );
        expect(component.previousAvailability).toBe(release);
        component.checkForUpdates();
        expect(component.availabilityLoading).toBeTrue();
        const calls = updateServiceSpy.getAvailableUpdates.calls.count();
        fixture.destroy();
        tick(10000);
        expect(updateServiceSpy.getAvailableUpdates.calls.count()).toBe(calls);
    }));

    it("replaces an older pending timer when a new check is requested", fakeAsync(() => {
        updateServiceSpy.checkForUpdates.and.returnValue(of(check));
        updateServiceSpy.getAvailableUpdates.and.returnValue(
            of({
                repositories: {},
                state: "pending",
                checkId: check.checkId,
            }),
        );
        updateServiceSpy.getAvailableUpdates.calls.reset();
        component.checkForUpdates();
        updateServiceSpy.checkForUpdates.and.returnValue(
            of({...check, checkId: "second"}),
        );
        updateServiceSpy.getAvailableUpdates.and.returnValue(
            of({...release, checkId: "second"}),
        );
        component.checkForUpdates();
        expect(component.availability?.checkId).toBe("second");
        tick(10000);
        expect(updateServiceSpy.getAvailableUpdates.calls.count()).toBe(2);
    }));

    it("adopts an active conflict status when an availability check is rejected", () => {
        updateServiceSpy.checkForUpdates.and.returnValue(
            fail(409, {
                error: "Update in progress",
                status: running,
            }),
        );
        component.checkForUpdates();
        expect(component.availabilityError).toBe("Update in progress");
        expect(component.availabilityLoading).toBeFalse();
        expect(component.status).toEqual(running);
        expect(component.attachedJobId).toBe(running.jobId!);
        expect(component.canStart).toBeFalse();
    });

    it("reports check submission errors without inventing a successful check", () => {
        updateServiceSpy.checkForUpdates.and.returnValue(
            fail(500, {message: "Check queue failed"}),
        );
        component.checkForUpdates();
        expect(component.availabilityError).toBe("Check queue failed");
        expect(component.availabilityLoading).toBeFalse();
        expect(component.pendingCheckLabel).toBe("unknown");
    });

    it("supports an uncorrelated legacy check response without polling forever", () => {
        updateServiceSpy.getAvailableUpdates.and.returnValue(of(release));
        component.checkForUpdates();
        expect(component.availability).toBe(release);
        expect(component.availabilityLoading).toBeFalse();
        updateServiceSpy.getAvailableUpdates.and.returnValue(fail(500));
        component.checkForUpdates();
        expect(component.availabilityError).toBe(
            "Update availability could not be loaded.",
        );
        expect(component.availabilityLoading).toBeFalse();
    });

    it("warns about a channel-only backend response while still adopting its real queued status", () => {
        enableRelease();
        updateServiceSpy.startUpdate.and.returnValue(
            of({
                job: {
                    jobId: "legacy",
                    channel: "release",
                    force: false,
                    confirmation: "UPDATE",
                },
                status: {state: "queued", jobId: "legacy"},
            }),
        );
        component.startUpdate();
        expect(component.status?.jobId).toBe("legacy");
        expect(component.isActive).toBeTrue();
        expect(component.actionError).toContain(
            "did not record pinned commits",
        );
        expect(render(".update-container > .alert-danger")).toContain(
            "Cancel it",
        );
    });

    it("reattaches a queued job with missing status and refreshes the status endpoint", () => {
        enableRelease();
        updateServiceSpy.startUpdate.and.returnValue(
            of({
                job: {
                    jobId: "recover",
                    channel: "release",
                    force: false,
                    confirmation: "UPDATE",
                    targets: {},
                },
            } as UpdateJobResponse),
        );
        updateServiceSpy.getStatus.and.returnValue(
            of({...running, jobId: "recover"}),
        );
        updateServiceSpy.getStatus.calls.reset();
        component.startUpdate();
        expect(component.actionError).toBe(
            "The update response did not include a status document.",
        );
        expect(updateServiceSpy.getStatus).toHaveBeenCalledTimes(1);
        expect(component.status?.state).toBe("restarting");
        expect(sessionStorage.getItem(component.jobStorageKey)).toBe("recover");
    });

    it("reports an empty update response without falsely becoming active", () => {
        enableRelease();
        updateServiceSpy.startUpdate.and.returnValue(
            of({} as UpdateJobResponse),
        );
        updateServiceSpy.getStatus.calls.reset();
        component.startUpdate();
        expect(component.actionError).toBe(
            "The update response did not include a status document.",
        );
        expect(component.starting).toBeFalse();
        expect(component.isActive).toBeFalse();
        expect(updateServiceSpy.getStatus).not.toHaveBeenCalled();
    });

    for (const status of [409, 503, 500]) {
        it(`handles HTTP ${status} when starting without claiming a completed install`, () => {
            enableRelease();
            updateServiceSpy.startUpdate.and.returnValue(
                fail(
                    status,
                    status === 409
                        ? {status: running}
                        : {state: "not_installed"},
                ),
            );
            component.startUpdate();
            expect(component.starting).toBeFalse();
            expect(component.isTerminal).toBeFalse();
            if (status === 409) {
                expect(component.actionError).toBe(
                    "An update is already queued or running.",
                );
                expect(component.status).toEqual(running);
            } else if (status === 503) {
                expect(component.installBlocker).toContain(
                    "update service is not installed",
                );
                expect(component.serviceUnavailable).toContain(
                    "docker_install.sh",
                );
            } else {
                expect(component.actionError).toBe(
                    "The update could not be started.",
                );
                expect(component.status).toEqual(ready);
            }
        });
    }

    it("reattaches a saved job through an initial outage and stops polling on a stale result", fakeAsync(() => {
        sessionStorage.setItem(component.jobStorageKey, "saved-job");
        updateServiceSpy.getStatus.and.returnValues(
            fail(503),
            of({
                ...running,
                jobId: "saved-job",
                classification: "stale",
                staleReason: "Executor stopped",
            }),
        );
        updateServiceSpy.getStatus.calls.reset();
        const restored = TestBed.createComponent(UpdateComponent);
        try {
            restored.detectChanges();
            const current = restored.componentInstance;
            expect(current.attachedJobId).toBe("saved-job");
            expect(current.maintenanceMessage).toContain("Reconnecting");
            expect(current.serviceUnavailable).toBeNull();
            tick(2000);
            restored.detectChanges();
            expect(current.isStale).toBeTrue();
            expect(current.isActive).toBeFalse();
            expect(current.isTerminal).toBeFalse();
            expect(current.attachedJobId).toBeNull();
            expect(sessionStorage.getItem(component.jobStorageKey)).toBeNull();
            expect(
                (restored.nativeElement as HTMLElement).textContent,
            ).toContain("Executor stopped");
            tick(10000);
            expect(updateServiceSpy.getStatus.calls.count()).toBe(2);
        } finally {
            restored.destroy();
        }
    }));

    it("backs off restart outages, caps retries, and reports connection failure rather than install failure", fakeAsync(() => {
        updateServiceSpy.getStatus.and.returnValue(of(running));
        component.refreshStatus();
        updateServiceSpy.getStatus.and.returnValue(fail(0));
        updateServiceSpy.getStatus.calls.reset();
        tick(2000);
        expect(updateServiceSpy.getStatus.calls.count()).toBe(1);
        expect(component.maintenanceMessage).toContain("Reconnecting");
        tick(1999);
        expect(updateServiceSpy.getStatus.calls.count()).toBe(1);
        tick(1);
        expect(updateServiceSpy.getStatus.calls.count()).toBe(2);
        tick(3999);
        expect(updateServiceSpy.getStatus.calls.count()).toBe(2);
        tick(1);
        expect(updateServiceSpy.getStatus.calls.count()).toBe(3);
        tick(8000);
        expect(updateServiceSpy.getStatus.calls.count()).toBe(4);
        tick(15000);
        expect(updateServiceSpy.getStatus.calls.count()).toBe(5);
        tick(75000);
        expect(component.persistentConnectionFailure).toBeTrue();
        expect(component.maintenanceMessage).toBeNull();
        expect(component.statusError).toContain(
            "connection failure, not a finished update result",
        );
        expect(component.status).toEqual(running);
        expect(component.isTerminal).toBeFalse();
        expect(render("[data-test='TXT_Update_Connection_Failure']")).toContain(
            "not a completed or failed",
        );
        const calls = updateServiceSpy.getStatus.calls.count();
        tick(30000);
        expect(updateServiceSpy.getStatus.calls.count()).toBe(calls);
        updateServiceSpy.getStatus.and.returnValue(
            of({...running, state: "done", classification: "succeeded"}),
        );
        component.refreshStatus();
        expect(component.persistentConnectionFailure).toBeFalse();
        expect(component.statusError).toBeNull();
        expect(component.status?.state).toBe("done");
        expect(sessionStorage.getItem(component.jobStorageKey)).toBeNull();
    }));

    it("clears remembered jobs on idle and refreshes revisions once on successful completion", fakeAsync(() => {
        updateServiceSpy.getStatus.and.returnValue(of(running));
        component.refreshStatus();
        expect(sessionStorage.getItem(component.jobStorageKey)).toBe(
            running.jobId!,
        );
        updateServiceSpy.getStatus.and.returnValue(of(ready));
        component.refreshStatus();
        expect(component.attachedJobId).toBeNull();
        updateServiceSpy.getInstalledRevisions.calls.reset();
        updateServiceSpy.getStatus.and.returnValue(
            of({...running, state: "done", classification: "succeeded"}),
        );
        component.refreshStatus();
        expect(updateServiceSpy.getInstalledRevisions).toHaveBeenCalledTimes(1);
        component.refreshStatus();
        expect(updateServiceSpy.getInstalledRevisions).toHaveBeenCalledTimes(1);
        const calls = updateServiceSpy.getStatus.calls.count();
        tick(10000);
        expect(updateServiceSpy.getStatus.calls.count()).toBe(calls);
    }));

    it("resets the log cursor and text when the status moves to a different job", () => {
        updateServiceSpy.getStatus.and.returnValue(of(running));
        updateServiceSpy.getLog.and.returnValue(
            of({offset: 0, nextOffset: 10, content: "old output"}),
        );
        component.refreshStatus();
        expect(component.logOffset).toBe(10);
        updateServiceSpy.getStatus.and.returnValue(
            of({...running, jobId: "next-job"}),
        );
        updateServiceSpy.getLog.and.returnValue(
            of({offset: 0, nextOffset: 3, content: "new"}),
        );
        component.refreshStatus();
        expect(updateServiceSpy.getLog.calls.mostRecent().args).toEqual([0]);
        expect(component.log).toBe("new");
        expect(component.logOffset).toBe(3);
        expect(component.attachedJobId).toBe("next-job");
    });

    it("bounds log memory while preserving the backend offset and the operator excerpt", () => {
        updateServiceSpy.getStatus.and.returnValue(of(running));
        const content = "x".repeat(100005) + "tail";
        updateServiceSpy.getLog.and.returnValue(
            of({offset: 0, nextOffset: 150000, content}),
        );
        component.refreshStatus();
        expect(component.log).toBe(content.slice(-100000));
        expect(component.logExcerpt).toBe(content.slice(-4000));
        expect(component.logOffset).toBe(150000);
        expect(component.logLoading).toBeFalse();
    });

    it("stops repeated log failures, lets the operator retry, and avoids duplicate in-flight reads", () => {
        // Terminal status does not reset the failure budget on every status poll.
        updateServiceSpy.getStatus.and.returnValue(
            of({state: "failed", jobId: "failed-job"}),
        );
        updateServiceSpy.getLog.and.returnValue(fail(500));
        updateServiceSpy.getLog.calls.reset();
        for (let attempt = 0; attempt < 6; attempt++) {
            component.refreshStatus();
        }
        expect(updateServiceSpy.getLog.calls.count()).toBe(5);
        expect(component.logError).toContain("stopped after repeated failures");
        const read = new Subject<{
            offset: number;
            nextOffset: number;
            content: string;
        }>();
        updateServiceSpy.getLog.and.returnValue(read);
        component.retryLog();
        expect(component.logError).toBeNull();
        expect(component.logLoading).toBeTrue();
        component.retryLog();
        expect(updateServiceSpy.getLog.calls.count()).toBe(6);
        read.next({offset: 0, nextOffset: 7, content: "retried"});
        read.complete();
        expect(component.log).toBe("retried");
        expect(component.logOffset).toBe(7);
        expect(component.logLoading).toBeFalse();
        component.status = ready;
        component.retryLog();
        expect(updateServiceSpy.getLog.calls.count()).toBe(6);
    });

    it("prevents duplicate cancellation requests and applies the returned cancellation status", () => {
        component.cancelUpdate();
        expect(updateServiceSpy.cancelUpdate).not.toHaveBeenCalled();
        updateServiceSpy.getStatus.and.returnValue(
            of({...running, cancelSafe: false}),
        );
        component.refreshStatus();
        expect(render("[data-test='TXT_Cancel_Safety']")).toContain(
            "next safe point",
        );
        const response = new Subject<{status: UpdateStatus}>();
        updateServiceSpy.cancelUpdate.and.returnValue(response);
        component.cancelUpdate();
        expect(component.cancelling).toBeTrue();
        component.cancelUpdate();
        expect(updateServiceSpy.cancelUpdate).toHaveBeenCalledTimes(1);
        response.next({status: {state: "cancelled", jobId: running.jobId}});
        response.complete();
        expect(component.cancelling).toBeFalse();
        expect(component.status?.state).toBe("cancelled");
        expect(component.isActive).toBeFalse();
        expect(sessionStorage.getItem(component.jobStorageKey)).toBeNull();
        expect(render("#update-result")).toContain(
            "Cancellation is not a rollback",
        );
    });

    it("refreshes real status when a cancellation acknowledgement has no status document", () => {
        component.status = {...running, cancelSafe: true};
        // Render via refreshStatus so OnPush receives the same production notification.
        updateServiceSpy.getStatus.and.returnValue(of(component.status));
        component.refreshStatus();
        expect(render("[data-test='TXT_Cancel_Safety']")).toContain(
            "currently safe between phases",
        );
        updateServiceSpy.cancelUpdate.and.returnValue(
            of({} as {status: UpdateStatus}),
        );
        updateServiceSpy.getStatus.and.returnValue(
            of({...running, cancelRequested: true}),
        );
        updateServiceSpy.getStatus.calls.reset();
        component.cancelUpdate();
        expect(updateServiceSpy.getStatus).toHaveBeenCalledTimes(1);
        expect(component.status?.cancelRequested).toBeTrue();
        expect(component.cancelling).toBeFalse();
        expect(component.isActive).toBeTrue();
    });

    for (const status of [409, 503, 500]) {
        it(`reports cancellation HTTP ${status} without treating it as a rollback`, () => {
            component.status = running;
            updateServiceSpy.cancelUpdate.and.returnValue(
                fail(
                    status,
                    status === 409
                        ? {status: {...running, cancelRequested: false}}
                        : {},
                ),
            );
            component.cancelUpdate();
            expect(component.cancelling).toBeFalse();
            expect(component.isTerminal).toBeFalse();
            expect(component.status?.state).toBe("restarting");
            if (status === 503) {
                expect(component.serviceUnavailable).toContain(
                    "update service is unavailable",
                );
            } else {
                expect(component.actionError).toBe(
                    "The cancellation request failed. This is not a rollback.",
                );
            }
        });
    }

    it("reports revision and idle status errors without assuming an update is running", () => {
        updateServiceSpy.getInstalledRevisions.and.returnValue(fail(500));
        component.loadInstalledRevisions();
        expect(component.installedError).toBe(
            "Installed revisions could not be loaded.",
        );
        expect(component.installedLoading).toBeFalse();
        updateServiceSpy.getStatus.and.returnValue(fail(500));
        component.refreshStatus();
        expect(component.statusError).toBe(
            "Update status could not be loaded. Polling has stopped.",
        );
        expect(component.statusLoading).toBeFalse();
        expect(component.maintenanceMessage).toBeNull();
        expect(component.isActive).toBeFalse();
    });
});
