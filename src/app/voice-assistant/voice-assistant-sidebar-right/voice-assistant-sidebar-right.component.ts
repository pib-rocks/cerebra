import {Component, Input} from "@angular/core";

@Component({
    selector: "app-voice-assistant-sidebar-right",
    templateUrl: "./voice-assistant-sidebar-right.component.html",
    styleUrls: ["./voice-assistant-sidebar-right.component.css"],
})
export class VoiceAssistantSidebarRightComponent {
    @Input() headerElements: {
        icon: string;
        active_icon: string;
        label: string;
        hovered: boolean;
    }[] = [];
    @Input() bodyElements: {
        description: string;
        active: boolean;
        hovered: boolean;
    }[] = [];
    @Input() elementIcon: string = "";
    @Input() elementIconActive: string = "";

    getIdString(element: string) {
        return "button_" + element.replaceAll(" ", "-");
    }

    onButtonHover(hoveredElement: any) {
        hoveredElement.hovered = !hoveredElement.hovered;
    }

    activateBodyElement(element: any) {
        element.active = true;
        for (const el of this.bodyElements) {
            if (el == element) {
                continue;
            } else {
                el.active = false;
            }
        }
    }
}
