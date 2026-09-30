import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    OnInit,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {DEGRADED_MODE, UNLOCKED_MODE} from "./key-store-session";
import {KeyStoreSessionService} from "./key-store-session.service";
import {StartupPasswordComponent} from "./startup-password.component";
import {ConversationStatusComponent} from "src/app/voice-assistant/visible-state/conversation-status.component";

@Component({
    selector: "app-display-unlock",
    templateUrl: "./display-unlock.component.html",
    styleUrls: ["./display-unlock.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [StartupPasswordComponent, ConversationStatusComponent],
})
export class DisplayUnlockComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    readonly unlockedMode = UNLOCKED_MODE;
    readonly degradedMode = DEGRADED_MODE;

    constructor(
        readonly session: KeyStoreSessionService,
        private readonly changeDetector: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.session.changes
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.changeDetector.markForCheck();
            });
    }
}
