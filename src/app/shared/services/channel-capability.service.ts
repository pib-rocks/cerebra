import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable, catchError, of} from "rxjs";
import {SMART_CHANNEL} from "../types/channel-router";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";

/** GET /voice-assistant/channel. Same fact as the personality payload. */
export interface ChatChannelDocument {
    smartChatsEnabled?: boolean;
    channels?: string[];
    defaultChannel?: string;
}

/**
 * Installation fact from --no-smart-chats. It is not a switch in the UI.
 * A missing endpoint leaves the current value, which starts as Smart available.
 */
export function smartChatsEnabledFromDocument(
    body: ChatChannelDocument | null | undefined,
): boolean {
    if (body && typeof body.smartChatsEnabled === "boolean") {
        return body.smartChatsEnabled;
    }
    if (body && Array.isArray(body.channels)) {
        return body.channels.includes(SMART_CHANNEL);
    }
    return true;
}

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
            .pipe(catchError(() => of(null)))
            .subscribe((body: ChatChannelDocument | null) => {
                if (body == null) {
                    return;
                }
                this.applyInstallerFlag(smartChatsEnabledFromDocument(body));
            });
    }

    applyInstallerFlag(smartChatsEnabled: boolean): void {
        this.smartChatsEnabledSubject.next(smartChatsEnabled);
    }
}
