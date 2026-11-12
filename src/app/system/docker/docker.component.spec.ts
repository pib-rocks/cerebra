import {ComponentFixture, TestBed} from "@angular/core/testing";
import {of} from "rxjs";

import {DockerManagementComponent} from "./docker.component";
import {DockerService} from "./docker.service";

describe("DockerManagementComponent purge", () => {
    let fixture: ComponentFixture<DockerManagementComponent>;
    let component: DockerManagementComponent;
    let service: jasmine.SpyObj<DockerService>;

    beforeEach(async () => {
        service = jasmine.createSpyObj<DockerService>("DockerService", [
            "getContainers",
            "purgeDocker",
            "getContainerLogs",
        ]);
        service.getContainers.and.returnValue(of([]));
        service.getContainerLogs.and.returnValue(
            of({status: "ok", logs: "line 1"}),
        );

        await TestBed.configureTestingModule({
            imports: [DockerManagementComponent],
            providers: [{provide: DockerService, useValue: service}],
        }).compileComponents();

        fixture = TestBed.createComponent(DockerManagementComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        jasmine.getEnv().allowRespy(true);
    });

    it("does nothing when the operator cancels the confirmation", () => {
        spyOn(window, "confirm").and.returnValue(false);

        component.purgeDocker();

        expect(service.purgeDocker).not.toHaveBeenCalled();
        expect(component.purging).toBeFalse();
    });

    it("shows the freed size the backend reports", () => {
        spyOn(window, "confirm").and.returnValue(true);
        service.purgeDocker.and.returnValue(
            of({
                status: "success",
                message: "Docker purge completed: 11.9 GB freed.",
                reclaimedHuman: "11.9 GB",
                errors: null,
            }),
        );

        component.purgeDocker();

        expect(component.successMessage).toBe(
            "Docker purge completed: 11.9 GB freed.",
        );
        expect(component.error).toBeNull();
        expect(component.purging).toBeFalse();
    });

    it("names the failed steps of a partial purge", () => {
        spyOn(window, "confirm").and.returnValue(true);
        service.purgeDocker.and.returnValue(
            of({
                status: "partial",
                message:
                    "Docker purge completed: 1.0 GB freed. 1 step(s) failed.",
                reclaimedHuman: "1.0 GB",
                errors: ["images: 500"],
            }),
        );

        component.purgeDocker();

        expect(component.successMessage).toContain("1.0 GB");
        expect(component.error).toContain("images: 500");
    });

    it("renders the live log modal with cerebra-modal and cerebra-modal-backdrop classes", () => {
        component.openLogsModal("ros-motors");
        fixture.detectChanges();
        component.stopLogStreaming();

        const modal = fixture.nativeElement.querySelector(
            ".modal.cerebra-modal",
        ) as HTMLElement;
        const backdrop = fixture.nativeElement.querySelector(
            ".modal-backdrop.cerebra-modal-backdrop",
        ) as HTMLElement;
        expect(modal).not.toBeNull();
        expect(backdrop).not.toBeNull();
        expect(
            modal
                .querySelector(".modal-content")
                ?.classList.contains("bg-dark"),
        ).toBeFalse();
    });
});

describe("DockerManagementComponent table and logs", () => {
    let fixture: ComponentFixture<DockerManagementComponent>;
    let component: DockerManagementComponent;
    let service: jasmine.SpyObj<DockerService>;

    beforeEach(async () => {
        service = jasmine.createSpyObj<DockerService>("DockerService", [
            "getContainers",
            "startContainer",
            "stopContainer",
            "getContainerLogs",
        ]);
        service.getContainers.and.returnValue(
            of([
                {
                    name: "app-one",
                    status: "running",
                    health: "healthy",
                    image: "app:latest",
                },
                {
                    name: "app-two",
                    status: "exited",
                    health: "unknown",
                    image: "app:latest",
                },
            ]),
        );
        service.getContainerLogs.and.returnValue(
            of({status: "ok", logs: "line 1\nline 2"}),
        );
        service.startContainer.and.returnValue(
            of({status: "ok", message: "started"}),
        );
        service.stopContainer.and.returnValue(
            of({status: "ok", message: "stopped"}),
        );

        await TestBed.configureTestingModule({
            imports: [DockerManagementComponent],
            providers: [{provide: DockerService, useValue: service}],
        }).compileComponents();

        fixture = TestBed.createComponent(DockerManagementComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("renders a combined status and health badge", () => {
        const badges = fixture.nativeElement.querySelectorAll(
            "#table-docker-containers tbody tr td .badge",
        ) as NodeListOf<HTMLElement>;
        expect(badges.length).toBeGreaterThanOrEqual(1);
        expect(badges[0].textContent?.trim()).toBe("RUNNING (HEALTHY)");
        expect(badges[0].classList.contains("text-bg-success")).toBeTrue();
        expect(badges[1].textContent?.trim()).toBe("STOPPED");
        expect(badges[1].classList.contains("text-bg-danger")).toBeTrue();
    });

    it("shows a state-aware Start/Stop toggle button per container", () => {
        const stopBtn = fixture.nativeElement.querySelector(
            '[data-test="BTN_Toggle_Container_app-one"]',
        ) as HTMLButtonElement;
        const startBtn = fixture.nativeElement.querySelector(
            '[data-test="BTN_Toggle_Container_app-two"]',
        ) as HTMLButtonElement;
        expect(stopBtn).not.toBeNull();
        expect(stopBtn.textContent).toContain("Stop");
        expect(stopBtn.classList.contains("btn-warning")).toBeTrue();
        expect(startBtn).not.toBeNull();
        expect(startBtn.textContent).toContain("Start");
        expect(startBtn.classList.contains("btn-success")).toBeTrue();
    });

    it("calls stopContainer when toggling a running container", () => {
        const stopBtn = fixture.nativeElement.querySelector(
            '[data-test="BTN_Toggle_Container_app-one"]',
        ) as HTMLButtonElement;
        stopBtn.click();
        expect(service.stopContainer).toHaveBeenCalledWith("app-one");
    });

    it("pauses autoScroll when the user scrolls up in the log viewer", () => {
        component.openLogsModal("app-one");
        fixture.detectChanges();
        component.stopLogStreaming();

        const el = component.logContainerElement?.nativeElement as HTMLElement;
        expect(el).toBeTruthy();

        Object.defineProperty(el, "scrollHeight", {
            configurable: true,
            value: 1000,
        });
        Object.defineProperty(el, "clientHeight", {
            configurable: true,
            value: 100,
        });
        el.scrollTop = 400;
        component.autoScroll = true;

        component.onLogScroll({target: el} as unknown as Event);
        expect(component.autoScroll).toBeFalse();
    });

    it("re-enables autoScroll when scrolled back to the bottom", () => {
        component.openLogsModal("app-one");
        fixture.detectChanges();
        component.stopLogStreaming();

        const el = component.logContainerElement?.nativeElement as HTMLElement;
        Object.defineProperty(el, "scrollHeight", {
            configurable: true,
            value: 1000,
        });
        Object.defineProperty(el, "clientHeight", {
            configurable: true,
            value: 100,
        });
        Object.defineProperty(el, "scrollTop", {
            configurable: true,
            writable: true,
            value: 868,
        });
        component.autoScroll = false;

        component.onLogScroll({target: el} as unknown as Event);
        expect(component.autoScroll).toBeTrue();
    });

    it("documents Purge Docker and requires inline confirmation before stopping a core container", () => {
        component.containers = [
            {
                name: "cerebra-angular-app-1",
                status: "running",
                health: "none",
                image: "ghcr.io/pib-rocks/cerebra:v0.7.13",
            },
            {
                name: "pib-backend-flask-app-1",
                status: "running",
                health: "none",
                image: "ghcr.io/pib-rocks/pib-backend-flask-app:v0.7.13",
            },
        ];
        (component as any).cdr.markForCheck();
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(
            el.querySelector('[data-test="TXT_Purge_Docker_Help"]')
                ?.textContent,
        ).toContain("safely removes stopped containers");
        expect(
            el.querySelector(
                '[data-test="BADGE_Core_Container_cerebra-angular-app-1"]',
            ),
        ).toBeTruthy();

        const stopBtn = el.querySelector<HTMLButtonElement>(
            '[data-test="BTN_Toggle_Container_cerebra-angular-app-1"]',
        );
        stopBtn!.click();
        fixture.detectChanges();

        expect(service.stopContainer).not.toHaveBeenCalled();
        expect(
            el.querySelector('[data-test="ALERT_Confirm_Stop_Core"]'),
        ).toBeTruthy();

        const confirmBtn = el.querySelector<HTMLButtonElement>(
            '[data-test="BTN_Confirm_Stop_Core_cerebra-angular-app-1"]',
        );
        confirmBtn!.click();
        fixture.detectChanges();

        expect(service.stopContainer).toHaveBeenCalledWith(
            "cerebra-angular-app-1",
        );
    });
});
