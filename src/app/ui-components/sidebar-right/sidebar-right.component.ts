import {Component, Input, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";

@Component({
    selector: "app-sidebar-right",
    templateUrl: "./sidebar-right.component.html",
    styleUrls: ["./sidebar-right.component.css"],
})
export class SideBarRightComponent implements OnInit {
    @Input() headerElements: {
        icon: string;
        label: string;
        clickCallback: () => void;
    }[] = [];
    @Input() elementIcon: string = "";
    @Input() subject!: Observable<SidebarElement[]>;
    @Input() lStorage!: string;
    sidebarElements!: SidebarElement[];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        this.subject.subscribe((serviceElements) => {
            this.sidebarElements = serviceElements;
            console.log(localStorage.getItem(this.lStorage));
            console.log(this.sidebarElements);
            if (localStorage.getItem(this.lStorage)) {
                this.router.navigate([localStorage.getItem(this.lStorage)], {
                    relativeTo: this.route,
                });
            } else if (this.sidebarElements.length > 0) {
                this.router.navigate([this.sidebarElements[0].getUUID()], {
                    relativeTo: this.route,
                });
            }
        });
    }
}
