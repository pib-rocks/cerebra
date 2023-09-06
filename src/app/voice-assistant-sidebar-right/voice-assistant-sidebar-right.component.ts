import {HttpClient} from "@angular/common/http";
import {Component, Input} from "@angular/core";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";

@Component({
    selector: "app-voice-assistant-sidebar-right",
    templateUrl: "./voice-assistant-sidebar-right.component.html",
    styleUrls: ["./voice-assistant-sidebar-right.component.css"],
})
export class VoiceAssistantSidebarRightComponent {
    @Input() headerElements: {icon: string; label: string}[] = [];
    @Input() bodyElements: string[] = [];
    @Input() elementIcon: string = "";

    getIdString(element: string) {
        return "button_" + element.replaceAll(" ", "-");
    }
}
