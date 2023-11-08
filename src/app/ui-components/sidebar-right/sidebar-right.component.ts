import {Component, Input, Output, EventEmitter, OnInit} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {SidebarService} from "src/app/shared/interfaces/sidebar-service.interface";

@Component({
    selector: "app-sidebar-right",
    templateUrl: "./sidebar-right.component.html",
    styleUrls: ["./sidebar-right.component.css"],
})
export class SideBarRightComponent implements OnInit {
    @Input() headerElements: {
        icon: string;
        active_icon: string;
        label: string;
        hovered: boolean;
        clickCallback: () => void;
    }[] = [];
    @Input() bodyElements: {
        id: string;
        name: string;
        selected: boolean;
        hovered: boolean;
    }[] = [];
    @Input() subject!: Observable<SidebarElement[]>;
    sidebarElements!: SidebarElement[];
    @Input() elementIcon: string = "";
    @Input() elementIconActive: string = "";

    @Output() headerButtonClickEvent = new EventEmitter<string>();
    @Output() bodyElementClickEvent = new EventEmitter<string>();

    headerButtonLabel: string | undefined;

    ngOnInit() {
        this.subject.subscribe((serviceElements) => {
            this.sidebarElements = serviceElements;
            serviceElements.forEach((element) => {
                console.log(element);
            });
            // (serviceElements[0] as SidebarElement).getName();
        });
        // this.service.getSubject.subscribe( (elements as SidebarElement[]) => {
        //     elements.forEach(elem => {
        //         console.log(elem.getName());
        //     })
        // })
    }
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
