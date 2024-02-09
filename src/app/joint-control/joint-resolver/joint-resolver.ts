import {
    ActivatedRouteSnapshot,
    ResolveFn,
    RouterStateSnapshot,
} from "@angular/router";
import {
    JointConfiguration,
    jointNameToConfiguration,
} from "../../shared/types/joint-configuration";

export const jointResolver: ResolveFn<JointConfiguration> = (
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
): JointConfiguration => {
    const jointName = route.params["joint-name"];
    return jointNameToConfiguration.get(jointName)!;
};
