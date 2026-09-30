import {Injectable} from "@angular/core";
import {Subject} from "rxjs";
import {KeyStoreService, keyStoreErrorMessage} from "./key-store.service";
import {
    DEGRADED_MODE,
    KeyStoreMode,
    PROMPT_MODE,
    UNLOCKED_MODE,
    chatsAvailable,
} from "./key-store-session";

@Injectable({
    providedIn: "root",
})
export class KeyStoreSessionService {
    mode: KeyStoreMode = PROMPT_MODE;
    error: string | null = null;
    busy = false;
    readonly changes = new Subject<void>();

    constructor(private readonly keyStore: KeyStoreService) {}

    get chatsAvailable(): boolean {
        return chatsAvailable(this.mode);
    }

    /**
     * Leave the prompt. The robot stays usable in the named degraded mode.
     */
    cancel(): void {
        this.mode = DEGRADED_MODE;
        this.error = null;
        this.busy = false;
        this.changes.next();
    }

    unlock(password: string): void {
        this.busy = true;
        this.error = null;
        this.changes.next();
        this.keyStore.unlock(password).subscribe({
            next: (result) => {
                this.busy = false;
                const opened = result.credentials?.length ?? 0;
                if (result.successful && opened > 0) {
                    this.mode = UNLOCKED_MODE;
                    this.error = null;
                } else if (result.successful) {
                    // An empty result does not open the store. That is not a
                    // wrong password; the robot stays in degraded mode.
                    this.mode = DEGRADED_MODE;
                    this.error = null;
                } else {
                    this.error =
                        result.error != null && result.error !== ""
                            ? result.error
                            : "Key store request failed.";
                }
                this.changes.next();
            },
            error: (err: unknown) => {
                this.busy = false;
                this.error = keyStoreErrorMessage(err);
                this.changes.next();
            },
        });
    }
}
