import {inject} from "@angular/core";
import {ResolveFn} from "@angular/router";
import {Observable} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {ChatService} from "src/app/shared/services/chat.service";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {Chat} from "src/app/shared/types/chat.class";

export const chatResolver: ResolveFn<Observable<any> | void> = (
    route,
): Observable<Chat> | void => {
    if (inject(ChatService).chats.length == 0) {
        if (route.url.length > 0) {
            return inject(ApiService).get(
                UrlConstants.CHAT + `/${route.url.pop()?.toString()}`,
            );
        }
    }
};
