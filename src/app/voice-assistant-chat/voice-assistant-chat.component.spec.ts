import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantChatComponent} from "./voice-assistant-chat.component";

describe("VoiceAssistantChatComponent", () => {
    let component: VoiceAssistantChatComponent;
    let fixture: ComponentFixture<VoiceAssistantChatComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VoiceAssistantChatComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(VoiceAssistantChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
