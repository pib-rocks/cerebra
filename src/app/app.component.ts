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
import {PROMPT_MODE} from "./system/keys/key-store-session";
import {KeyStoreSessionService} from "./system/keys/key-store-session.service";
import {StartupPasswordComponent} from "./system/keys/startup-password.component";
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

    // Below this width the navigation overlays the content instead of sitting
    // beside it, and there the collapse class means the opposite (set = shown),
    // so the arrow and aria-expanded have to be derived from what the click does.
    private static readonly OVERLAY_QUERY = "(max-width: 767.98px)";
    private readonly overlayQuery =
        typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window.matchMedia(AppComponent.OVERLAY_QUERY)
            : null;

    currentRoute: string = "";
    isActiveRoute = false;
    onDisplayPath = false;
    sidebarCollapsed = false;
    navigationOverlaid = false;
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
        this.navigationOverlaid = this.overlayQuery?.matches ?? false;
        if (this.overlayQuery != null) {
            const onOverlayChange = (event: MediaQueryListEvent): void => {
                this.navigationOverlaid = event.matches;
                this.changeDetector.markForCheck();
            };
            this.overlayQuery.addEventListener("change", onOverlayChange);
            this.destroyRef.onDestroy(
                () =>
                    this.overlayQuery?.removeEventListener(
                        "change",
                        onOverlayChange,
                    ),
            );
        }
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

    /**
     * Whether the navigation can be seen right now: beside the content it is
     * collapsed away by the collapse class, overlaid it is shown by the same
     * class. The arrow and the controls' labels follow this, not the class, so
     * they keep pointing at what a click actually does.
     */
    isNavigationVisible(): boolean {
        return this.navigationOverlaid
            ? this.sidebarCollapsed
            : !this.sidebarCollapsed;
    }

    private isDisplayUrl(url: string): boolean {
        const path = url.split("?")[0];
        return path === "/display" || path.startsWith("/display/");
    }
}
