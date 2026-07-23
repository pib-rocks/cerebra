import {Component, OnInit, ChangeDetectionStrategy} from "@angular/core";
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
    currentRoute: string = "";
    isActiveRoute = false;
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
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.isActiveRoute =
                    event.urlAfterRedirects.includes("joint-control");
            }
        });
    }
}
