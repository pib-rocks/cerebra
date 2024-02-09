import {inject} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivateFn, Router} from "@angular/router";
import {
    JointPathName,
    jointNameToConfiguration,
} from "../shared/types/joint-configuration";

const DEFAULT_ROUTE: string[] = [`/joint-control/${JointPathName.HEAD}`];

export const jointGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const name = route.params["joint-name"];
    if (jointNameToConfiguration.get(name)) return true;
    else return inject(Router).navigate(DEFAULT_ROUTE);
};
