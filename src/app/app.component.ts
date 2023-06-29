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
  isActiveRoute = false;
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
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isActiveRoute = this.jointControlNavItemGroup.includes(event.urlAfterRedirects);
      }
    });
}
}
