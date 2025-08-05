import {Component, OnInit} from "@angular/core";
import {RosService} from "src/app/shared/services/ros-service/ros.service";

@Component({
    selector: "app-relay-control",
    templateUrl: "./relay-control.component.html",
    styleUrls: ["./relay-control.component.scss"],
})
export class RelayControlComponent implements OnInit {
    turnedOn = false;
    isRelayAvailable = false;

    constructor(private rosService: RosService) {}

    ngOnInit(): void {
        // set current state of SSR (in case another user is using it)
        this.rosService.solidStateRelayStateReceiver$.subscribe({
            next: (state) => {
                this.isRelayAvailable = true;
                this.turnedOn = state.turned_on;
            },
            error: () => {
                this.isRelayAvailable = false;
            },
            // complete: () => {
            //   this.isRelayAvailable = false;
            // }
        });
    }

    toggleSSR() {
        if (!this.isRelayAvailable) return;

        const newState = !this.turnedOn;
        this.turnedOn = newState;
        this.rosService
            .setSolidStateRelayState({turned_on: newState})
            .subscribe({
                error: (error) => console.error(error),
            });
    }
}
