import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantPersonalityComponent} from "./voice-assistant-personality.component";
import {VoiceAssistantNavComponent} from "../voice-assistant-nav/voice-assistant-nav.component";
import {VoiceAssistantSidebarRightComponent} from "../voice-assistant-sidebar-right/voice-assistant-sidebar-right.component";
import {RouterTestingModule} from "@angular/router/testing";
import {ReactiveFormsModule} from "@angular/forms";

describe("VoiceAssistantPersonalityComponent", () => {
    let component: VoiceAssistantPersonalityComponent;
    let fixture: ComponentFixture<VoiceAssistantPersonalityComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                VoiceAssistantPersonalityComponent,
                VoiceAssistantNavComponent,
                VoiceAssistantSidebarRightComponent,
            ],
            imports: [RouterTestingModule, ReactiveFormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(VoiceAssistantPersonalityComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
