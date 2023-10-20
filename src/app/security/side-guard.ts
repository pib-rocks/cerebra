import {inject} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivateFn, Router} from "@angular/router";

export const sideGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    if (route.params["side"] === "left" || route.params["side"] === "right") {
        return true;
    }
    return inject(Router).navigate(["/head"]);
};
