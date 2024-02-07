import {inject} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivateFn, Router} from "@angular/router";

const LEGAL_NAMES: string[] = [
    "head",
    "left-hand",
    "right-hand",
    "left-arm",
    "right-arm",
];
const DEFAULT_ROUTE: string[] = ["/joint-control/head"];

export const jointGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const name = route.params["joint-name"];
    return LEGAL_NAMES.includes(name) || inject(Router).navigate(DEFAULT_ROUTE);
};
