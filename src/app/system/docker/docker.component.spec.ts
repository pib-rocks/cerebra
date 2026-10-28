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
        ]);
        service.getContainers.and.returnValue(of([]));

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
});
