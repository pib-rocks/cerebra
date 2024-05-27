import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {FormControl} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable, Subscription} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {CerebraRegex} from "src/app/shared/types/cerebra-regex";
import {VoiceAssistantState} from "src/app/shared/types/voice-assistant-state";

@Component({
    selector: "app-sidebar-right",
    templateUrl: "./sidebar-right.component.html",
    styleUrls: ["./sidebar-right.component.scss"],
})
export class SideBarRightComponent implements OnInit, OnDestroy {
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
        private voiceAssistantService: VoiceAssistantService,
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
