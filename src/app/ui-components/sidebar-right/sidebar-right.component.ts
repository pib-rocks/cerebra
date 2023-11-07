import {Component, Input, Output, EventEmitter} from "@angular/core";

@Component({
    selector: "app-sidebar-right",
    templateUrl: "./sidebar-right.component.html",
    styleUrls: ["./sidebar-right.component.css"],
})
export class SideBarRightComponent {
    @Input() tabTitle: string | undefined;
    @Input() headerElements: {
        icon: string;
        active_icon: string;
        label: string;
        hovered: boolean;
    }[] = [];
    @Input() bodyElements: {
        id: string;
        name: string;
        selected: boolean;
        hovered: boolean;
    }[] = [];
    @Input() elementIcon: string = "";
    @Input() elementIconActive: string = "";

    @Output() headerButtonClickEvent = new EventEmitter<string>();
    @Output() bodyElementClickEvent = new EventEmitter<string>();
    headerButtonLabel: string | undefined;

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
                el.selected = false;
            }
        }
        this.bodyElementClickEvent.emit(element.id);
    }

    onHeaderButtonClick(element: any) {
        this.headerButtonClickEvent.emit(element.label);
    }
}
