import {ActivatedRouteSnapshot, CanActivateFn} from "@angular/router";

export const sideGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    if (route.params["side"] === "left" || route.params["side"] === "right") {
        return true;
    }
    return false;
};
