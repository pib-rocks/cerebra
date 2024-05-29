import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {Pose} from "../types/pose";

@Injectable({
    providedIn: "root",
})
export class PoseService {
    constructor() {}

    getAllPoses(): Observable<Pose[]> {
        return new BehaviorSubject([
            {name: "dev", poseId: "456"},
            {name: "abc", poseId: "123"},
        ]);
    }

    saveCurrentPose(name: string): Observable<Pose> {
        return new BehaviorSubject({name: "xyz", poseId: "12345"});
    }
}
