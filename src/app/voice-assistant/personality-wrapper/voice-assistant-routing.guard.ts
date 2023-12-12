import {inject} from "@angular/core";
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from "@angular/router";

export const voiceAssistantRoutingGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    const urlSegment = localStorage.getItem("voice-assistant");
    const urlSplit = state.url.split("/");
    if (
        urlSplit[urlSplit.length - 1] === "personality" ||
        urlSplit[urlSplit.length - 1] === "chat"
    ) {
        return true;
    }
    return urlSegment
        ? inject(Router).navigate([state.url + `/${urlSegment}`])
        : inject(Router).navigate([state.url + `/personality`]);
};
