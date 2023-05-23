import { Component, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  currentRoute: string = "";
  title = "cerebra";
  isCurrentPathInJointControlNavItem = false;
  jointControlNavItemGroup = [
    "/",
    "/head",
    "/hand/left",
    "/hand/right",
    "/arm/left",
    "/arm/right",
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
        this.checkIfThecurrentRouteInJointControlNavItem(this.currentRoute);
      }
    });
  }

  checkIfThecurrentRouteInJointControlNavItem(route: string) {
    if (this.jointControlNavItemGroup.includes(route)) {
      this.isCurrentPathInJointControlNavItem = true;
    } else {
      this.isCurrentPathInJointControlNavItem = false;
    }
  }
}
