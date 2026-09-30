import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable, catchError, of} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";

/**
 * Installation fact from --no-smart-chats. It is not a switch in the UI.
 * A missing endpoint leaves Smart available, which is the default.
 */
@Injectable({
    providedIn: "root",
})
export class ChannelCapabilityService {
    private readonly smartChatsEnabledSubject = new BehaviorSubject<boolean>(
        true,
    );
    readonly smartChatsEnabled$: Observable<boolean> =
        this.smartChatsEnabledSubject.asObservable();

    constructor(private readonly apiService: ApiService) {
        this.load();
    }

    get smartChatsEnabled(): boolean {
        return this.smartChatsEnabledSubject.getValue();
    }

    load(): void {
        this.apiService
            .get(UrlConstants.CHAT_CHANNEL)
            .pipe(catchError(() => of({smartChatsEnabled: true})))
            .subscribe((body: {smartChatsEnabled?: boolean}) => {
                this.applyInstallerFlag(body?.smartChatsEnabled !== false);
            });
    }

    applyInstallerFlag(smartChatsEnabled: boolean): void {
        this.smartChatsEnabledSubject.next(smartChatsEnabled);
    }
}
