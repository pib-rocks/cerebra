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
  jointControlNavItem = false;
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
        console.log(this.currentRoute);
        this.checkIfThecurrentRouteInJointControlNavItem(this.currentRoute);
      }
    });
  }

  checkIfThecurrentRouteInJointControlNavItem(route: string) {
    if (this.jointControlNavItemGroup.includes(route)) {
      this.jointControlNavItem = true;
    } else {
      this.jointControlNavItem = false;
    }
  }
}
