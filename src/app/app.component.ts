import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    DestroyRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
    NavigationEnd,
    Router,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
} from "@angular/router";
import {RelayControlComponent} from "./ui-components/relay-control/relay-control.component";
import {SmartConnectComponent} from "./ui-components/smart-connect/smart-connect.component";
import {IpRetrieverComponent} from "./ui-components/ip-retriever/ip-retriever.component";
import {APP_VERSION} from "./shared/util/version";
import {PROMPT_MODE} from "./system/speech/key-store-session";
import {KeyStoreSessionService} from "./system/speech/key-store-session.service";
import {StartupPasswordComponent} from "./system/speech/startup-password.component";
import {ConversationStatusComponent} from "./voice-assistant/visible-state/conversation-status.component";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        RouterLink,
        RouterLinkActive,
        RelayControlComponent,
        SmartConnectComponent,
        IpRetrieverComponent,
        RouterOutlet,
        StartupPasswordComponent,
        ConversationStatusComponent,
    ],
})
export class AppComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    currentRoute: string = "";
    isActiveRoute = false;
    onDisplayPath = false;
    sidebarCollapsed = false;
    appVersion: string = APP_VERSION;
    jointControlNavItemGroup = [
        "/joint-control/",
        "/joint-control/head",
        "/joint-control/left-hand",
        "/joint-control/right-hand",
        "/joint-control/left-arm",
        "/joint-control/right-arm",
    ];

    constructor(
        private router: Router,
        readonly session: KeyStoreSessionService,
        private readonly changeDetector: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.onDisplayPath = this.isDisplayUrl(this.router.url);
        this.session.changes
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.changeDetector.markForCheck();
            });
        this.session.refresh();
        this.router.events
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                if (event instanceof NavigationEnd) {
                    this.isActiveRoute =
                        event.urlAfterRedirects.includes("joint-control");
                    this.onDisplayPath = this.isDisplayUrl(
                        event.urlAfterRedirects,
                    );
                }
            });
    }

    showStartupPassword(): boolean {
        return this.session.mode === PROMPT_MODE && !this.onDisplayPath;
    }

    toggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    private isDisplayUrl(url: string): boolean {
        const path = url.split("?")[0];
        return path === "/display" || path.startsWith("/display/");
    }
}
