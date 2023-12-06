import {Component, Input, OnInit} from "@angular/core";
import {Observable} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";

@Component({
    selector: "app-voice-assistant-nav",
    templateUrl: "./voice-assistant-nav.component.html",
    styleUrls: ["./voice-assistant-nav.component.css"],
})
export class VoiceAssistantNavComponent implements OnInit {
    sidebarElements?: SidebarElement[];
    @Input() subject?: Observable<SidebarElement[]>;
    @Input() button?: {enabled: boolean; func: () => void};

    ngOnInit(): void {
        this.subject?.subscribe((elements) => {
            this.sidebarElements = elements;
        });
    }
}
