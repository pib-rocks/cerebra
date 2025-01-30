import {TestBed, fakeAsync, flush, tick} from "@angular/core/testing";

import {PoseService} from "./pose.service";
import {ApiService} from "./api.service";
import {MotorService} from "./motor.service";
import {Pose, PoseDTO} from "../types/pose";
import {Subject, of} from "rxjs";
import {MotorPosition} from "../types/motor-position";

describe("PoseService", () => {
    let poseService: PoseService;
    let apiService: jasmine.SpyObj<ApiService>;
    let motorService: jasmine.SpyObj<MotorService>;

    let posesSubscriber: jasmine.Spy;
    let indexLeftSubject: Subject<number> = new Subject();

    const pose1 = new Pose("pose-1", "id-1");
    const pose2 = new Pose("pose-2", "id-2");
    const pose3 = new Pose("pose-3", "id-3");

    const motorPositions: MotorPosition[] = [
        {
            motorName: "index_left_stretch",
            position: 1000,
        },
        {
            motorName: "index_right_stretch",
            position: 2000,
        },
    ];

    beforeEach(() => {
        const apiServiceSpy: jasmine.SpyObj<ApiService> = jasmine.createSpyObj(
            "ApiService",
            ["post", "get", "patch", "delete"],
        );
        const motorServiceSpy: jasmine.SpyObj<MotorService> =
            jasmine.createSpyObj("MotorService", [
                "getPositionObservable",
                "applyPose",
            ]);

        const poses: PoseDTO[] = [
            {
                name: pose1.name,
                poseId: pose1.poseId,
            },
            {
                name: pose2.name,
                poseId: pose2.poseId,
            },
        ];

        apiServiceSpy.get.and.returnValue(of({poses}));

        TestBed.configureTestingModule({
            providers: [
                PoseService,
                [
                    {
                        provide: ApiService,
                        useValue: apiServiceSpy,
                    },
                    {
                        provide: MotorService,
                        useValue: motorServiceSpy,
                    },
                ],
            ],
        });

        motorServiceSpy.getPositionObservable.and.callFake((motorName) => {
            return motorName == "index_left_stretch" ? indexLeftSubject : of();
        });

        poseService = TestBed.inject(PoseService);
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        motorService = TestBed.inject(
            MotorService,
        ) as jasmine.SpyObj<MotorService>;

        apiServiceSpy.get = jasmine.createSpy();

        posesSubscriber = jasmine.createSpy();
        poseService.getPosesObservable().subscribe(posesSubscriber);
    });

    it("should be created", () => {
        expect(poseService).toBeTruthy();
    });

    it("should return the correct observable", () => {
        expect(posesSubscriber).toHaveBeenCalledOnceWith([pose1, pose2]);
    });

    it("should save the current pose", () => {
        apiService.post.and.returnValue(of(pose3));
        const savePoseSubcriber = jasmine.createSpy();

        indexLeftSubject.next(3000);
        poseService.saveCurrentPose(pose3.name).subscribe(savePoseSubcriber);

        const [url, requestBody]: [string, Record<string, any>] =
            apiService.post.calls.argsFor(0);
        const name: string = requestBody["name"];
        const motorPositions: MotorPosition[] = requestBody["motorPositions"];

        expect(url).toEqual("/pose");
        expect(name).toEqual(pose3.name);
        expect(motorPositions.length).toEqual(26);
        for (const motorPosition of motorPositions) {
            if (motorPosition.motorName == "index_left_stretch") {
                expect(motorPosition.position).toEqual(3000);
            } else {
                expect(motorPosition.position).toEqual(0);
            }
        }
        expect(posesSubscriber).toHaveBeenCalledWith([pose1, pose2, pose3]);
        expect(savePoseSubcriber).toHaveBeenCalledOnceWith(pose3);
    });

    it("should rename the pose", () => {
        const name = "updated-name";
        const updatedPose1Dto: PoseDTO = {name, poseId: pose1.poseId};
        const updatedPose1 = new Pose(name, pose1.poseId);
        apiService.patch.and.returnValue(of(updatedPose1Dto));

        poseService.renamePose(pose1.poseId, name);

        expect(apiService.patch).toHaveBeenCalledOnceWith(
            "/pose/" + pose1.poseId,
            {name},
        );
        expect(posesSubscriber).toHaveBeenCalledWith([updatedPose1, pose2]);
    });

    it("should delete the pose", () => {
        apiService.delete.and.returnValue(of(undefined));

        poseService.deletePose(pose1.poseId);

        expect(apiService.delete).toHaveBeenCalledOnceWith(
            "/pose/" + pose1.poseId,
        );
        expect(posesSubscriber).toHaveBeenCalledWith([pose2]);
    });

    it("should not apply the pose if it cannot be found", () => {
        const unknownPoseId = "unknown-pose-id";

        poseService.applyPose(unknownPoseId);

        expect(motorService.applyPose).not.toHaveBeenCalled();
    });

    it("should apply the pose", fakeAsync(() => {
        const pose1Deactivated = new Pose(pose1.name, pose1.poseId);
        pose1Deactivated.active = false;

        poseService.applyPose(pose1.poseId);

        expect(motorService.applyPose.calls.argsFor(0)).toEqual([pose1.poseId]);
        expect(posesSubscriber.calls.argsFor(0)).toEqual([
            [pose1Deactivated, pose2],
        ]);

        tick(500); // pose1 should not have been reactivated yet

        poseService.applyPose(pose1.poseId);

        // 'applyPose' should not have been called again, because the pose is not active
        expect(motorService.applyPose).toHaveBeenCalledTimes(1);
        // new poses should not have been published yet
        expect(posesSubscriber).toHaveBeenCalledTimes(1);

        tick(500); // now, pose1 should be active again

        // the reactivated pose1 should have been published
        expect(posesSubscriber.calls.argsFor(1)).toEqual([[pose1, pose2]]);

        poseService.applyPose(pose1.poseId);

        // now, 'setPositions' should not have been called again, because the pose is active again
        expect(motorService.applyPose.calls.argsFor(1)).toEqual([pose1.poseId]);

        flush();
    }));
});
