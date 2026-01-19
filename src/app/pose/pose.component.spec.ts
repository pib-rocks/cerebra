import {ComponentFixture, TestBed} from "@angular/core/testing";

import {PoseComponent} from "./pose.component";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {PoseService} from "src/app/shared/services/pose.service";
import {Subject, of} from "rxjs";
import {Pose} from "src/app/shared/types/pose";

describe("PoseComponent", () => {
    let component: PoseComponent;
    let fixture: ComponentFixture<PoseComponent>;

    let poseService: jasmine.SpyObj<PoseService>;
    let modalService: jasmine.SpyObj<NgbModal>;

    let posesSubject = new Subject();

    let posesSubscriber: jasmine.Spy;

    const pose1 = new Pose("pose-1", "id-1");
    const pose2 = new Pose("pose-2", "id-2");
    const pose3 = new Pose("pose-3", "id-3");

    beforeEach(async () => {
        let poseServiceSpy = jasmine.createSpyObj("PoseService", [
            "getPosesObservable",
            "saveCurrentPose",
            "renamePose",
            "deletePose",
            "applyPose",
            "updatePose",
        ]);

        let modalServiceSpy = jasmine.createSpyObj("ModalService", ["open"]);

        poseServiceSpy.getPosesObservable.and.returnValue(posesSubject);

        await TestBed.configureTestingModule({
            declarations: [PoseComponent],
            providers: [
                {
                    provide: PoseService,
                    useValue: poseServiceSpy,
                },
                {
                    provide: NgbModal,
                    useValue: modalServiceSpy,
                },
            ],
        }).compileComponents();

        poseService = TestBed.inject(
            PoseService,
        ) as jasmine.SpyObj<PoseService>;
        modalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;

        posesSubscriber = jasmine.createSpy();

        fixture = TestBed.createComponent(PoseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.poses.subscribe(posesSubscriber);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get its poses from the service", () => {
        posesSubject.next([pose1, pose2]);
        expect(posesSubscriber).toHaveBeenCalledWith([pose1, pose2]);
        posesSubject.next([pose3]);
        expect(posesSubscriber).toHaveBeenCalledWith([pose3]);
    });

    it("should save the pose", async () => {
        const name = "name";
        let nameFormValueBefore: string = "";
        let modalPromise!: Promise<any>;
        let mockRef: NgbModalRef = {
            get result() {
                let promise = new Promise((resolve, reject) => {
                    nameFormValueBefore = component.nameFormControl.value!;
                    component.nameFormControl.setValue(name);
                    resolve(undefined);
                });
                modalPromise = promise;
                return promise;
            },
        } as NgbModalRef;
        modalService.open.and.returnValue(mockRef);
        poseService.saveCurrentPose.and.returnValue(of(pose3));

        component.savePose();
        await modalPromise;

        expect(nameFormValueBefore).toEqual("New pose");
        expect(component.modalTitle).toEqual("Add new pose");
        expect(poseService.saveCurrentPose).toHaveBeenCalledOnceWith(name);
        expect(component.selectedPoseId).toEqual(pose3.poseId);
    });

    it("should rename the pose", async () => {
        const name = "name";
        let pose2Renamed = new Pose(name, pose2.poseId);
        let nameFormValueBefore: string = "";
        let modalPromise!: Promise<any>;
        let mockRef: NgbModalRef = {
            get result() {
                let promise = new Promise((resolve, reject) => {
                    nameFormValueBefore = component.nameFormControl.value!;
                    component.nameFormControl.setValue(name);
                    resolve(undefined);
                });
                modalPromise = promise;
                return promise;
            },
        } as NgbModalRef;
        modalService.open.and.returnValue(mockRef);
        poseService.saveCurrentPose.and.returnValue(of(pose2Renamed));

        component.renamePose(pose2);
        await modalPromise;

        expect(nameFormValueBefore).toEqual(pose2.name);
        expect(component.modalTitle).toEqual("Rename pose");
        expect(poseService.renamePose).toHaveBeenCalledOnceWith(
            pose2.poseId,
            name,
        );
        expect(component.selectedPoseId).toEqual(pose2.poseId);
    });

    it("should delete the pose", () => {
        component.deletePose(pose1);
        expect(poseService.deletePose).toHaveBeenCalledOnceWith(pose1.poseId);
    });

    it("should apply the pose", () => {
        component.applyPose(pose2);
        expect(poseService.applyPose).toHaveBeenCalledOnceWith(pose2.poseId);
        expect(component.selectedPoseId).toEqual(pose2.poseId);
    });

    it("should select the pose", () => {
        component.selectPose(pose3);
        expect(component.selectedPoseId).toEqual(pose3.poseId);
    });

    it("should update the selected pose", () => {
        component.selectedPoseId = pose1.poseId;

        component.updatePose();

        expect(poseService.updatePose).toHaveBeenCalledOnceWith(pose1.poseId);
    });
});
