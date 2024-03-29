import {
    ActivatedRouteSnapshot,
    ResolveFn,
    RouterStateSnapshot,
} from "@angular/router";
import {
    MotorConfiguration,
    motorPathNameToConfig,
} from "src/app/shared/types/motor-configuration";

export const motorResolver: ResolveFn<MotorConfiguration> = (
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
): MotorConfiguration => {
    const motorName = route.params["motor-name"];
    return motorPathNameToConfig.get(motorName)!;
};
