import {Component, ErrorHandler, NgZone} from "@angular/core";

@Component({
    selector: "app-global-error-handler",
    templateUrl: "./global-error-handler.component.html",
    styleUrls: ["./global-error-handler.component.css"],
})
export class GlobalErrorHandlerComponent implements ErrorHandler {
    constructor(private zone: NgZone) {}
    handleError(error: any): void {
        this.zone.run(() => {
            if (error) {
                console.log(error.message);
            } else {
                console.log("An unexpected error has occurred");
            }
        });
    }
}
