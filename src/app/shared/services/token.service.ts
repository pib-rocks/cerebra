import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {filter, take} from "rxjs/operators";
import {RosService} from "./ros-service/ros.service";

@Injectable({
    providedIn: "root",
})
export class TokenService {
    private readonly tokenStatusSubject = new BehaviorSubject<{
        tokenExists: boolean;
        tokenActive: boolean;
    }>({
        tokenExists: false,
        tokenActive: false,
    });
    tokenStatus$ = this.tokenStatusSubject.asObservable();

    constructor(private readonly rosService: RosService) {
        this.rosService.connectionStatus$
            .pipe(
                filter((isConnected) => isConnected),
                take(1),
            )
            .subscribe(() => {
                this.checkTokenExists();
            });
    }

    checkTokenExists() {
        this.rosService.checkTokenExists().subscribe((response) => {
            this.tokenStatusSubject.next({
                tokenExists: response.token_exists,
                tokenActive: response.token_active,
            });
        });
    }
}
