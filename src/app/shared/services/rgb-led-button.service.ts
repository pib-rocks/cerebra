import {Injectable} from "@angular/core";
import {ButtonProgram} from "../types/button-program";
import {Observable} from "rxjs";
import {UtilService} from "./util.service";
import {UrlConstants} from "./url.constants";
import {ApiService} from "./api.service";

@Injectable({
    providedIn: "root",
})
export class RgbLedButtonService {
    constructor(private apiService: ApiService) {}

    getButtonPrograms(): Observable<ButtonProgram[]> {
        return UtilService.createResultObservable(
            this.apiService.get(UrlConstants.RGB_BUTTON),
            (response) => {
                return response.buttonPrograms;
            },
        );
    }

    updateButtonPrograms(
        buttonPrograms: ButtonProgram[],
    ): Observable<ButtonProgram[]> {
        return UtilService.createResultObservable(
            this.apiService.put(UrlConstants.RGB_BUTTON, {
                buttonProgramUpdates: buttonPrograms,
            }),
            (response) => {
                return response.buttonPrograms;
            },
        );
    }
}
