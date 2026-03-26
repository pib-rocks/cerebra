import {Injectable} from "@angular/core";
import {Program} from "../types/program";
import {Observable} from "rxjs";
import {UtilService} from "./util.service";
import {UrlConstants} from "./url.constants";
import {ApiService} from "./api.service";

@Injectable({
    providedIn: "root",
})
export class RgbLedButtonService {
    buttonPrograms: any[] = [];

    constructor(private apiService: ApiService) {}

    getButtonPrograms(): Observable<any[]> {
        return UtilService.createResultObservable(
            this.apiService.get(UrlConstants.RGB_BUTTON),
            (response) => {
                this.buttonPrograms = response;
                return response;
            },
        );
    }

    updateButtonPrograms(buttonPrograms: any): Observable<any> {
        return UtilService.createResultObservable(
            this.apiService.put(UrlConstants.RGB_BUTTON, buttonPrograms),
            (response) => {
                this.buttonPrograms = response;
                return response;
            },
        );
    }
}
