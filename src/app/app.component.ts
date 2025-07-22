import {Component, OnInit} from "@angular/core";
import {NavigationEnd, Router} from "@angular/router";
import {IpService} from "./shared/services/ip.service";

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
    hostIp: string = "";

    constructor(
        private router: Router,
        private ipService: IpService,
    ) {}

    ngOnInit(): void {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.isActiveRoute =
                    event.urlAfterRedirects.includes("joint-control");
            }
        });

        this.ipService.getHostIp().subscribe((ip) => {
            this.hostIp = ip;
        });
    }
}
