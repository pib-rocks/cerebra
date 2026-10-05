import {Injectable} from "@angular/core";
import {Subject} from "rxjs";
import {KeyStoreService, keyStoreErrorMessage} from "./key-store.service";
import {
    DEGRADED_MODE,
    KeyStoreMode,
    PROMPT_MODE,
    STARTING_MODE,
    UNLOCKED_MODE,
    chatsAvailable,
    modeAfterStatus,
} from "./key-store-session";

@Injectable({
    providedIn: "root",
})
export class KeyStoreSessionService {
    mode: KeyStoreMode = STARTING_MODE;
    error: string | null = null;
    busy = false;
    readonly changes = new Subject<void>();

    constructor(private readonly keyStore: KeyStoreService) {}

    get chatsAvailable(): boolean {
        return chatsAvailable(this.mode);
    }

    /**
     * Read the backend operating mode. The dialog follows `mode` only.
     */
    refresh(): void {
        this.keyStore.status().subscribe({
            next: (status) => this.noteStatus(status),
            error: () => undefined,
        });
    }

    noteStatus(status: {encryptKeyStorage?: boolean; mode?: string}): void {
        const next = modeAfterStatus(this.mode, status);
        if (next === this.mode) {
            return;
        }
        this.mode = next;
        this.error = null;
        this.changes.next();
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
                // A refused unlock means the store is still locked, so the dialog
                // belongs on screen - also when no status has arrived yet. A store
                // that is open (cleartext included) is never pushed back.
                if (this.mode !== UNLOCKED_MODE) {
                    this.mode = PROMPT_MODE;
                }
                this.changes.next();
            },
        });
    }
}
