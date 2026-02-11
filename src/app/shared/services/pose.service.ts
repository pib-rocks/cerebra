import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable, Subject, map, of, tap} from "rxjs";
import {Pose, PoseDTO} from "../types/pose";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {MotorPosition} from "../types/motor-position";
import {MotorService} from "./motor.service";
import {motors} from "../types/motor-configuration";

@Injectable({
    providedIn: "root",
})
export class PoseService {
    private poses: Pose[] = [];
    private posesSubject: Subject<Pose[]> = new BehaviorSubject(this.poses);
    private poseIdToMotorPositions: Map<string, MotorPosition[]> = new Map();
    private currentMotorPositions: MotorPosition[];

    constructor(
        private apiService: ApiService,
        private motorService: MotorService,
    ) {
        this.currentMotorPositions = motors
            .filter((motor) => !motor.isMultiMotor)
            .map((motor) => ({motorName: motor.motorName, position: 0}));
        this.currentMotorPositions.forEach((motorPosition) => {
            motorService
                .getPositionObservable(motorPosition.motorName)
                .subscribe((position) => (motorPosition.position = position));
        });
        this.getAllPosesFromDb().subscribe((poses) => {
            this.poses.unshift(...poses);
            this.publishPoses();
        });
    }

    public getPosesObservable(): Observable<Pose[]> {
        return this.posesSubject;
    }

    public saveCurrentPose(name: string): Observable<Pose> {
        const motorPositions = this.currentMotorPositions;
        return this.createPoseInDb(name, motorPositions).pipe(
            tap((pose) => {
                this.poses.push(pose);
                this.publishPoses();
                this.poseIdToMotorPositions.set(
                    pose.poseId,
                    structuredClone(motorPositions),
                );
            }),
        );
    }

    public renamePose(poseId: string, name: string) {
        this.renamePoseInDb(poseId, name).subscribe(() => {
            const pose = this.getCachedPoseOfId(poseId);
            if (pose) {
                pose.name = name;
                this.publishPoses();
            }
        });
    }

    public deletePose(poseId: string) {
        this.deletePoseFromDb(poseId).subscribe(() => {
            this.poses = this.poses.filter((pose) => pose.poseId !== poseId);
            this.publishPoses();
        });
    }

    public applyPose(poseId: string) {
        const pose = this.getCachedPoseOfId(poseId);
        if (!pose?.active) return;
        const motorPositions = this.poseIdToMotorPositions.get(poseId);
        const positionsObservable: Observable<MotorPosition[]> = motorPositions
            ? of(motorPositions)
            : this.getMotorPositionsOfPoseFromDb(poseId).pipe(
                  tap((mp) => this.poseIdToMotorPositions.set(poseId, mp)),
              );
        positionsObservable.subscribe((motorPositions) => {
            this.motorService.setPositions(motorPositions);
            pose.active = false;
            this.publishPoses();
            setTimeout(() => {
                pose.active = true;
                this.publishPoses();
            }, 1000);
        });
    }

    public updatePoseMotorPositions(poseId: string): Observable<void> {
        const motorPositions = this.currentMotorPositions;
        return this.updatePoseMotorPositionsInDb(poseId, motorPositions).pipe(
            tap(() => {
                this.poseIdToMotorPositions.set(
                    poseId,
                    structuredClone(motorPositions),
                );
            }),
        );
    }

    private getMotorPositionsOfPoseFromDb(
        poseId: string,
    ): Observable<MotorPosition[]> {
        return this.apiService
            .get(`${UrlConstants.POSE}/${poseId}/motor-positions`)
            .pipe(map((dto) => dto["motorPositions"]));
    }
    private getAllPosesFromDb(): Observable<Pose[]> {
        return this.apiService.get(UrlConstants.POSE).pipe(
            map((posesDto) => {
                const poseDtos: PoseDTO[] = posesDto["poses"];
                return poseDtos.map(
                    (dto) => new Pose(dto.name, dto.poseId, dto.deletable),
                );
            }),
        );
    }

    private renamePoseInDb(poseId: string, name: string): Observable<any> {
        return this.apiService.patch(`${UrlConstants.POSE}/${poseId}`, {name});
    }

    private createPoseInDb(
        name: string,
        motorPositions: MotorPosition[],
    ): Observable<Pose> {
        return this.apiService
            .post(UrlConstants.POSE, {name, motorPositions})
            .pipe(
                map(
                    (dto: PoseDTO) =>
                        new Pose(dto.name, dto.poseId, dto.deletable),
                ),
            );
    }

    private deletePoseFromDb(poseId: string): Observable<any> {
        return this.apiService.delete(`${UrlConstants.POSE}/${poseId}`);
    }

    private updatePoseMotorPositionsInDb(
        poseId: string,
        motorPositions: MotorPosition[],
    ): Observable<void> {
        return this.apiService.patch(
            `${UrlConstants.POSE}/${poseId}/motor-positions`,
            {motorPositions},
        );
    }

    private publishPoses() {
        this.posesSubject.next(this.poses);
    }

    private getCachedPoseOfId(poseId: string): Pose | undefined {
        return this.poses.find((pose) => pose.poseId === poseId);
    }
}
