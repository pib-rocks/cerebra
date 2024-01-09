import {ErrorHandler, Injectable, NgZone} from "@angular/core";

@Injectable({providedIn: "root"})
export class CerebraErrorHandler implements ErrorHandler {
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
