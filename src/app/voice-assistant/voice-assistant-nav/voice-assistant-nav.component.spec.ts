import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantNavComponent} from "./voice-assistant-nav.component";
import {RouterTestingModule} from "@angular/router/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {BoolToOnOffPipe} from "../../shared/pipes/bool-to-on-off-pipe.pipe";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {Router} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";

describe("VoiceAssistantNavComponent", () => {
    let component: VoiceAssistantNavComponent;
    let fixture: ComponentFixture<VoiceAssistantNavComponent>;
    let elements: SidebarElement[];
    let router: Router;
    let subject: BehaviorSubject<SidebarElement[]>;
    let spyOnRouterUrl: jasmine.Spy;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VoiceAssistantNavComponent, BoolToOnOffPipe],
            imports: [RouterTestingModule, ReactiveFormsModule],
        }).compileComponents();
        router = TestBed.inject(Router);
        elements = [
            new VoiceAssistant(
                "01234567-0123-0123-0123-0123456789ab",
                "123",
                "",
                0,
                "",
            ),
            new VoiceAssistant("223", "223", "", 0, ""),
            new VoiceAssistant("323", "323", "", 0, ""),
            new VoiceAssistant("423", "424", "", 0, ""),
            new VoiceAssistant("525", "525", "", 0, ""),
        ];
        subject = new BehaviorSubject<SidebarElement[]>(elements);
        fixture = TestBed.createComponent(VoiceAssistantNavComponent);
        component = fixture.componentInstance;
        component.subject = subject;
        spyOnRouterUrl = spyOnProperty(router, "url").and.returnValue(
            "/voice-assistant/01234567-0123-0123-0123-0123456789ab",
        );

        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should retrieve the correct route or undefined", () => {
        component.sidebarElements = elements;
        let route = component.getRedirectRoute();
        expect(route).toBe(component.sidebarElements[0].getUUID());
        spyOnRouterUrl.and.returnValue("123");
        route = component.getRedirectRoute();
        expect(route).toBeFalsy();
    });
});
