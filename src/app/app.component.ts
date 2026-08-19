import {Component, OnInit} from "@angular/core";
import {NavigationEnd, Router} from "@angular/router";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
    currentRoute: string = "";
    isActiveRoute = false;
    showFullView = this.readViewAllCookie();
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
                this.updateViewMode(event.urlAfterRedirects);
            }
        });

        this.updateViewMode(
            `${window.location.pathname}${window.location.search}`,
        );
    }

    private updateViewMode(url: string): void {
        const urlTree = this.router.parseUrl(url);
        const viewAllParameter = urlTree.queryParams["viewall"];

        if (viewAllParameter === "true") {
            this.showFullView = true;
            document.cookie =
                "viewall=true; Path=/; Max-Age=31536000; SameSite=Lax";
        } else if (viewAllParameter === "false") {
            this.showFullView = false;
            document.cookie =
                "viewall=; Path=/; Max-Age=0; SameSite=Lax";
        } else {
            this.showFullView = this.readViewAllCookie();
        }

        const primarySegments =
            urlTree.root.children["primary"]?.segments ?? [];
        const isJointControlRoute =
            primarySegments[0]?.path === "joint-control";

        if (!this.showFullView && !isJointControlRoute) {
            void this.router.navigate(["/joint-control", "head"], {
                replaceUrl: true,
            });
        }
    }

    private readViewAllCookie(): boolean {
        return document.cookie
            .split(";")
            .map((cookie) => cookie.trim())
            .some((cookie) => cookie === "viewall=true");
    }
}
