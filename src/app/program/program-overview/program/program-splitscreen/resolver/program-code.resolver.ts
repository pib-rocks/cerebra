import {inject} from "@angular/core";
import {
    ActivatedRouteSnapshot,
    ResolveFn,
    RouterStateSnapshot,
} from "@angular/router";
import {Observable} from "rxjs";
import {ProgramService} from "src/app/shared/services/program.service";
import {ProgramCode} from "src/app/shared/types/program-code";

export const programCodeResolver: ResolveFn<ProgramCode> = (
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
): Observable<ProgramCode> => {
    const programNumber: string = route.params["program-number"];
    return inject(ProgramService).getCodeByProgramNumber(programNumber);
};
