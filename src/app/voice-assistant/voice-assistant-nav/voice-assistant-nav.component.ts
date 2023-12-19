import {Component, Input, OnInit} from "@angular/core";
import {ActivatedRoute, Router, UrlTree} from "@angular/router";
import {Observable} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {CerebraRegex} from "src/app/shared/types/cerebra-regex";

@Component({
    selector: "app-voice-assistant-nav",
    templateUrl: "./voice-assistant-nav.component.html",
    styleUrls: ["./voice-assistant-nav.component.css"],
})
export class VoiceAssistantNavComponent implements OnInit {
    sidebarElements?: SidebarElement[];
    @Input() subject?: Observable<SidebarElement[]>;
    @Input() button?: {enabled: boolean; func: () => void};
    @Input() defaultRoute?: string;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.subject?.subscribe((elements) => {
            const diff = elements.length - (this.sidebarElements?.length ?? 0);
            const len = this.sidebarElements?.length ?? 0;
            this.sidebarElements = elements;
            if (len == 0 && elements.length > 0) {
                this.router.navigate([this.sidebarElements[0].getUUID()], {
                    relativeTo: this.route,
                });
            } else if (diff > 0 && len != 0) {
                this.router.navigate(
                    [
                        this.sidebarElements[
                            this.sidebarElements.length - 1
                        ].getUUID(),
                    ],
                    {relativeTo: this.route},
                );
            } else if (this.getRedirectRoute()) {
                this.router.navigate([this.getRedirectRoute()], {
                    relativeTo: this.route,
                });
            } else {
                this.router.navigate([this.defaultRoute]);
            }
        });
    }

    getRedirectRoute(): string | undefined {
        const routerUuid: string | undefined = this.router.url
            .split("/")
            .find((segment) => RegExp(CerebraRegex.UUID).test(segment));
        if (routerUuid && this.sidebarElements) {
            const elem = this.sidebarElements.find((sidebarElement) =>
                RegExp(routerUuid).test(sidebarElement.getUUID()),
            );
            if (!elem && this.sidebarElements.length > 0) {
                return this.sidebarElements[0].getUUID();
            } else if (elem) {
                return elem.getUUID();
            }
        }
        return undefined;
    }
}
