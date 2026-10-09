import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    Input,
    OnInit,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {VisibleStateService} from "src/app/shared/services/visible-state.service";
import {
    IDLE,
    VisibleConversation,
    visibleConversation,
} from "src/app/shared/types/visible-state";
import {AnimatedFaceComponent} from "./animated-face.component";

@Component({
    selector: "app-conversation-status",
    templateUrl: "./conversation-status.component.html",
    styleUrls: ["./conversation-status.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AnimatedFaceComponent],
})
export class ConversationStatusComponent implements OnInit {
    /**
     * "display" is the robot screen and keeps the animated face.
     * "assistant" is the voice-assistant personality row and shows the
     * holder text only. The old global header surface is gone.
     */
    @Input() surface: "assistant" | "display" = "display";

    private readonly destroyRef = inject(DestroyRef);
    state: VisibleConversation = visibleConversation({
        voiceTurnedOn: false,
        listening: false,
        assistantSpeaking: false,
        holderName: null,
        keyStoreDegraded: false,
        liveUnavailable: false,
    });
    readonly idle = IDLE;

    constructor(
        readonly visible: VisibleStateService,
        private readonly changeDetector: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.state = this.visible.snapshot;
        this.visible.snapshot$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.state = state;
                this.changeDetector.markForCheck();
            });
    }
}
