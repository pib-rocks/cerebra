import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {RosService} from "./ros-service/ros.service";

@Injectable({
    providedIn: "root",
})
export class TokenService {
    private tokenStatusSubject = new BehaviorSubject<{
        tokenExists: boolean;
        tokenActive: boolean;
    }>({
        tokenExists: false,
        tokenActive: false,
    });
    tokenStatus$ = this.tokenStatusSubject.asObservable();

    constructor(private rosService: RosService) {}

    checkTokenExists() {
        this.rosService.checkTokenExists().subscribe((response) => {
            this.tokenStatusSubject.next({
                tokenExists: response.token_exists,
                tokenActive: response.token_active,
            });
        });
    }
}
