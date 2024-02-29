import {inject} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivateFn, Router} from "@angular/router";
import {motorPathNameToConfig} from "../shared/types/motor-configuration";
import {JointPathName} from "../shared/types/joint-configuration";

const DEFAULT_ROUTE: string[] = [`/joint-control/${JointPathName.HEAD}`];

export const motorGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const name = route.params["motor-name"];
    if (motorPathNameToConfig.get(name)) return true;
    else return inject(Router).navigate(DEFAULT_ROUTE);
};
