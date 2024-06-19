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
