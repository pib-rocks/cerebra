import {Injectable} from "@angular/core";
import {RosService} from "./ros-service/ros.service";
import {ApiService} from "./api.service";
import {Observable} from "rxjs";
import {MotorSettings} from "../types/motor-settings.class";

@Injectable({
    providedIn: "root",
})
export class MotorService {
    constructor(
        private rosService: RosService,
        private apiService: ApiService,
    ) {}

    getSettingObservable(motorName: string): Observable<MotorSettings> {
        return new Observable();
    }

    applySettings(motorSettings: MotorSettings): Observable<void> {
        return new Observable();
    }

    getPositionObservable(motorName: string): Observable<number> {
        return new Observable();
    }

    applyPosition(motorName: string, position: number): Observable<number> {
        return new Observable();
    }

    getCurrentObservable(motorName: string): Observable<number> {
        return new Observable();
    }
}
