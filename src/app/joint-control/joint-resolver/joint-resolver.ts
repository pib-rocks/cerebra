import {
    ActivatedRouteSnapshot,
    ResolveFn,
    RouterStateSnapshot,
} from "@angular/router";
import {
    JointConfiguration,
    jointPathNameToConfig,
} from "../../shared/types/joint-configuration";

export const jointResolver: ResolveFn<JointConfiguration> = (
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
): JointConfiguration => {
    const jointName = route.params["joint-name"];
    return jointPathNameToConfig.get(jointName)!;
};
