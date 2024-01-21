import {inject} from "@angular/core";
import {
    ActivatedRouteSnapshot,
    ResolveFn,
    RouterStateSnapshot,
} from "@angular/router";
import {Observable} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {CerebraRegex} from "src/app/shared/types/cerebra-regex";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";

export const voiceAssistantResolver: ResolveFn<Observable<any> | void> = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
): Observable<VoiceAssistant> | void => {
    if (inject(VoiceAssistantService).personalities.length == 0) {
        if (route.url.length > 0) {
            return inject(ApiService).get(
                UrlConstants.PERSONALITY +
                    `/${state.url
                        .split("/")
                        .find((segment) =>
                            RegExp(CerebraRegex.UUID).test(segment),
                        )
                        ?.toString()}`,
            );
        }
    }
};
