import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
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
    ],
})
export class AppComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    currentRoute: string = "";
    isActiveRoute = false;
    appVersion: string = APP_VERSION;
    jointControlNavItemGroup = [
        "/joint-control/",
        "/joint-control/head",
        "/joint-control/left-hand",
        "/joint-control/right-hand",
        "/joint-control/left-arm",
        "/joint-control/right-arm",
    ];

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.router.events
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                if (event instanceof NavigationEnd) {
                    this.isActiveRoute =
                        event.urlAfterRedirects.includes("joint-control");
                }
            });
    }
}
