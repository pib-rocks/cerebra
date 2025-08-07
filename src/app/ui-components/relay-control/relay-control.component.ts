import {Component, OnInit} from "@angular/core";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {catchError, throwError, timeout} from "rxjs";

@Component({
    selector: "app-relay-control",
    templateUrl: "./relay-control.component.html",
    styleUrls: ["./relay-control.component.scss"],
})
export class RelayControlComponent implements OnInit {
    turnedOn = false;
    isRelayAvailable = false;

    constructor(
        private rosService: RosService,
        private matSnackBarService: MatSnackBar,
    ) {}

    ngOnInit(): void {
        // set current state of SSR (in case another user is using it)
        this.rosService.solidStateRelayStateReceiver$.subscribe({
            next: (state) => {
                if (state) {
                    this.isRelayAvailable = true;
                    this.turnedOn = state.turned_on;
                } else {
                    this.isRelayAvailable = false;
                }
            },
        });
    }

    toggleSSR() {
        if (!this.isRelayAvailable) return;

        const newState = !this.turnedOn;
        this.turnedOn = newState;
        this.rosService
            .setSolidStateRelayState({turned_on: newState})
            .pipe(
                timeout(3000),
                catchError((err) => {
                    this.matSnackBarService.open(
                        "Could not set status of Solid State Relay.",
                        "",
                        {panelClass: "cerebra-toast", duration: 3000},
                    );
                    return throwError(() => err);
                }),
            )
            .subscribe();
    }
}
