import {ComponentFixture, TestBed} from "@angular/core/testing";
import {MatSnackBar} from "@angular/material/snack-bar";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {Subject} from "rxjs";
import {PoseService} from "../../shared/services/pose.service";
import {RobotResetComponent} from "./robot-reset.component";

describe("RobotResetComponent", () => {
    let component: RobotResetComponent;
    let fixture: ComponentFixture<RobotResetComponent>;
    let poseService: jasmine.SpyObj<PoseService>;
    let modalService: jasmine.SpyObj<NgbModal>;
    let snackBar: jasmine.SpyObj<MatSnackBar>;
    let resetSequence: Subject<void>;
    let modalRef: jasmine.SpyObj<NgbModalRef>;

    beforeEach(async () => {
        resetSequence = new Subject<void>();
        poseService = jasmine.createSpyObj("PoseService", [
            "applyPoseSequence",
        ]);
        poseService.applyPoseSequence.and.returnValue(resetSequence);

        modalRef = jasmine.createSpyObj(
            "NgbModalRef",
            ["close", "dismiss"],
            {result: new Promise(() => undefined)},
        );
        modalService = jasmine.createSpyObj("NgbModal", ["open"]);
        modalService.open.and.returnValue(modalRef);
        snackBar = jasmine.createSpyObj("MatSnackBar", ["open"]);

        await TestBed.configureTestingModule({
            declarations: [RobotResetComponent],
            providers: [
                {provide: PoseService, useValue: poseService},
                {provide: NgbModal, useValue: modalService},
                {provide: MatSnackBar, useValue: snackBar},
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RobotResetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should lock the UI while the reset sequence runs", () => {
        component.resetPosition();

        expect(modalService.open).toHaveBeenCalledWith(
            component.resetProgressModal,
            jasmine.objectContaining({
                backdrop: "static",
                keyboard: false,
            }),
        );
        expect(poseService.applyPoseSequence).toHaveBeenCalledOnceWith(
            ["start1", "start2", "start3"],
            10_000,
        );
        expect(component.isResetting).toBeTrue();

        component.resetPosition();
        expect(poseService.applyPoseSequence).toHaveBeenCalledTimes(1);

        resetSequence.complete();
        expect(modalRef.close).toHaveBeenCalledTimes(1);
        expect(component.isResetting).toBeFalse();
    });

    it("should unlock the UI and report a failed reset", () => {
        spyOn(console, "error");
        component.resetPosition();
        resetSequence.error(new Error("motor service unavailable"));

        expect(modalRef.close).toHaveBeenCalledTimes(1);
        expect(component.isResetting).toBeFalse();
        expect(snackBar.open).toHaveBeenCalled();
    });
});
