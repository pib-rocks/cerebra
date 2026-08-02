import {
    Component,
    Input,
    OnDestroy,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnChanges,
} from "@angular/core";
import {
    ActivatedRoute,
    Router,
    RouterLinkActive,
    RouterLink,
} from "@angular/router";
import {Observable, Subscription} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from "@ng-bootstrap/ng-bootstrap/dropdown";

@Component({
    selector: "app-sidebar-right",
    templateUrl: "./sidebar-right.component.html",
    styleUrls: ["./sidebar-right.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        RouterLinkActive,
        RouterLink,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
    ],
})
export class SideBarRightComponent implements OnInit, OnDestroy, OnChanges {
    @Input() optionCallbackMethods: {
        icon: string;
        label: string;
        clickCallback: (uuid: string) => void;
        disabled: boolean;
    }[] = [];

    @Input() dropdownCallbackMethods: {
        icon: string;
        label: string;
        clickCallback: (uuid: string) => void;
        disabled: boolean;
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
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    ngOnInit() {
        this._updateSidebar();
        this.selectedObservable?.subscribe((uuid?: string) => {
            this.router.navigate([uuid ?? "."], {relativeTo: this.route});
        });
    }

    // if subject is modified, routing won't update in VA
    // therefore, watch for changes to update
    ngOnChanges(changes: {[x: string]: any}) {
        if (changes["subject"]) {
            this._updateSidebar();
        }
    }

    _updateSidebar() {
        this.subscription = this.subject.subscribe(
            (serviceElements: SidebarElement[]) => {
                this.sidebarElements = serviceElements;
                this.cdr.markForCheck();
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
    }

    toLowerCaseAndRemoveSpace(label: string): string {
        return label.toLowerCase().replace(/\s+/g, "-");
    }
}
