import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    RouterStateSnapshot,
} from "@angular/router";

export const sideGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    if (route.params["side"] === "left" || route.params["side"] === "right") {
        return true;
    }
    return false;
};
