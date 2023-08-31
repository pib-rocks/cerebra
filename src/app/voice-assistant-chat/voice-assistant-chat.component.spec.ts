import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantChatComponent} from "./voice-assistant-chat.component";
import {VoiceAssistantNavComponent} from "../voice-assistant-nav/voice-assistant-nav.component";
import {VoiceAssistantSidebarRightComponent} from "../voice-assistant-sidebar-right/voice-assistant-sidebar-right.component";
import {RouterTestingModule} from "@angular/router/testing";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

describe("VoiceAssistantChatComponent", () => {
    let component: VoiceAssistantChatComponent;
    let fixture: ComponentFixture<VoiceAssistantChatComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                VoiceAssistantChatComponent,
                VoiceAssistantNavComponent,
                VoiceAssistantSidebarRightComponent,
            ],
            imports: [RouterTestingModule, ReactiveFormsModule, FormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(VoiceAssistantChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
