import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable, Subscription} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";

@Component({
    selector: "app-sidebar-right",
    templateUrl: "./sidebar-right.component.html",
    styleUrls: ["./sidebar-right.component.css"],
})
export class SideBarRightComponent implements OnInit, OnDestroy {
    @Input() calbackMethods: {
        icon: string;
        label: string;
        clickCallback: (uuid: string) => void;
    }[] = [];
    @Input() elementIcon: string = "";
    @Input() rerouteOnRefresh: boolean = true;
    @Input() subject!: Observable<SidebarElement[]>;
    @Input() lStorage!: string;
    @Input() selectedObservable?: Observable<string | undefined>;
    sidebarElements!: SidebarElement[];
    subscription!: Subscription;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {}
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    ngOnInit() {
        this.subscription = this.subject.subscribe(
            (serviceElements: SidebarElement[]) => {
                this.sidebarElements = serviceElements;
                if (!this.rerouteOnRefresh) return;
                if (
                    this.sidebarElements.find(
                        (sidebarelem) =>
                            sidebarelem.getUUID() ===
                            localStorage.getItem(this.lStorage),
                    )
                ) {
                    this.router.navigate(
                        [localStorage.getItem(this.lStorage)],
                        {
                            relativeTo: this.route,
                        },
                    );
                } else if (this.sidebarElements.length > 0) {
                    this.router.navigate([this.sidebarElements[0].getUUID()], {
                        relativeTo: this.route,
                    });
                } else {
                    this.router.navigate(["."], {relativeTo: this.route});
                }
            },
        );
        this.selectedObservable?.subscribe((uuid?: string) => {
            this.router.navigate([uuid ?? "."], {relativeTo: this.route});
        });
    }

    removeCssClass(uuid: string) {
        const videoSettingsButton = document.getElementById(
            "dropdownbutton-" + uuid,
        );
        videoSettingsButton?.classList.remove("showPopover");
    }

    addCssClass(uuid: string) {
        const videoSettingsButton = document.getElementById(
            "dropdownbutton-" + uuid,
        );
        videoSettingsButton?.classList.add("showPopover");
    }
}
