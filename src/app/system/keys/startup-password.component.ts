import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    OnInit,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {KeyStoreSessionService} from "./key-store-session.service";

@Component({
    selector: "app-startup-password",
    templateUrl: "./startup-password.component.html",
    styleUrls: ["./startup-password.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class StartupPasswordComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    password = "";

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

    onPasswordInput(event: Event): void {
        this.password = (event.target as HTMLInputElement).value;
    }

    ok(): void {
        this.session.unlock(this.password);
    }

    cancel(): void {
        this.password = "";
        this.session.cancel();
    }
}
