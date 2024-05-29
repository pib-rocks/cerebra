import {inject} from "@angular/core";
import {
    ActivatedRouteSnapshot,
    ResolveFn,
    RouterStateSnapshot,
} from "@angular/router";
import {Observable} from "rxjs";
import {PoseService} from "src/app/shared/services/pose.service";
import {Pose} from "src/app/shared/types/pose";

export const posesResolver: ResolveFn<Pose[]> = (
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
): Observable<Pose[]> => {
    return inject(PoseService).getAllPoses();
};
