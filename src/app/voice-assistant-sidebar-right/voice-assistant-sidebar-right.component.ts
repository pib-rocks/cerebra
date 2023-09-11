import {Component, Input} from "@angular/core";

@Component({
    selector: "app-voice-assistant-sidebar-right",
    templateUrl: "./voice-assistant-sidebar-right.component.html",
    styleUrls: ["./voice-assistant-sidebar-right.component.css"],
})
export class VoiceAssistantSidebarRightComponent {
    @Input() headerElements: {icon: string; label: string}[] = [];
    @Input() bodyElements: {
        description: string;
        active: boolean;
        hovered: boolean;
    }[] = [];
    @Input() elementIcon: string = "";
    @Input() elementIconActive: string = "";

    isHovered = false;

    getIdString(element: string) {
        return "button_" + element.replaceAll(" ", "-");
    }

    onButtonHover(hoveredElement: any) {
        hoveredElement.hovered = !hoveredElement.hovered;
    }

    activateElement(element: any) {
        element.active = true;
        for (let el of this.bodyElements) {
            if (el == element) {
                continue;
            } else {
                el.active = false;
            }
        }
    }
}
