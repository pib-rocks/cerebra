import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable, Subject, map, of, tap} from "rxjs";
import {Pose, PoseDTO} from "../types/pose";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {MotorPosition} from "../types/motor-position";
import {MotorService} from "./motor.service";

@Injectable({
    providedIn: "root",
})
export class PoseService {
    private poses: Pose[] = [];
    private posesSubject: Subject<Pose[]> = new BehaviorSubject(this.poses);
    private poseIdToMotorPositions: Map<string, MotorPosition[]> = new Map();

    constructor(
        private apiService: ApiService,
        private motorService: MotorService,
    ) {
        this.getAllPosesFromDb().subscribe((poses) => {
            this.poses.unshift(...poses);
            this.publishPoses();
        });
    }

    public getPosesObservable(): Observable<Pose[]> {
        return this.posesSubject;
    }

    public saveCurrentPose(name: string): Observable<Pose> {
        const motorPositions = this.motorService.getCurrentPositions();
        return this.createPoseInDb(name, motorPositions).pipe(
            tap((pose) => {
                this.poses.push(pose);
                this.publishPoses();
                this.poseIdToMotorPositions.set(pose.poseId, motorPositions);
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
            for (const {motorname, position} of motorPositions) {
                this.motorService.setPosition(motorname, position);
            }
            pose.active = false;
            this.publishPoses();
            setTimeout(() => {
                pose.active = true;
                this.publishPoses();
            }, 1000);
        });
    }

    private getAllPosesFromDb(): Observable<Pose[]> {
        return this.apiService.get(UrlConstants.POSE).pipe(
            map((posesDto) => {
                const poseDtos: PoseDTO[] = posesDto["poses"];
                return poseDtos.map((dto) => new Pose(dto.name, dto.poseId));
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
            .pipe(map((dto: PoseDTO) => new Pose(dto.name, dto.poseId)));
    }

    private deletePoseFromDb(poseId: string): Observable<any> {
        return this.apiService.delete(`${UrlConstants.POSE}/${poseId}`);
    }

    private getMotorPositionsOfPoseFromDb(
        poseId: string,
    ): Observable<MotorPosition[]> {
        return this.apiService
            .get(`${UrlConstants.POSE}/${poseId}/motor-positions`)
            .pipe(map((dto) => dto["motorPositions"]));
    }

    private publishPoses() {
        this.posesSubject.next(this.poses);
    }

    private getCachedPoseOfId(poseId: string): Pose | undefined {
        return this.poses.find((pose) => pose.poseId === poseId);
    }
}