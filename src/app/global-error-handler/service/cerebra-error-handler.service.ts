import {ErrorHandler, Injectable} from "@angular/core";

@Injectable({providedIn: "root"})
export class CerebraErrorHandler implements ErrorHandler {
    handleError(error: any): void {
        if (error) {
            console.error(error.message);
        } else {
            console.error("An unexpected error has occurred");
        }
    }
}
