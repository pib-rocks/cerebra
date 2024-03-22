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
    styleUrls: ["./sidebar-right.component.css"],
})
export class SideBarRightComponent implements OnInit, OnDestroy {
    @Input() callbackMethods: {
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
    vaState: boolean = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private voiceAssistantService: VoiceAssistantService,
    ) {}

    voiceAssistantActivationToggle = new FormControl(false);

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
        this.voiceAssistantService.voiceAssistantStateObservable.subscribe(
            (state: VoiceAssistantState) => {
                this.voiceAssistantActivationToggle.setValue(state.turnedOn);
            },
        );
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

    toggleVoiceAssistant() {
        const turnedOn = !this.voiceAssistantActivationToggle.value;
        const nextState: VoiceAssistantState = {turnedOn, chatId: ""};
        if (turnedOn) {
            const match = RegExp(
                `/voice-assistant/${CerebraRegex.UUID}/chat/(${CerebraRegex.UUID})`,
            ).exec(this.router.url);
            if (match) nextState.chatId = match[1];
            else throw new Error("no chat selected");
        }

        this.vaState = turnedOn;

        this.voiceAssistantService.setVoiceAssistantState(nextState).subscribe({
            error: (error) => console.error(error),
        });
    }
}
