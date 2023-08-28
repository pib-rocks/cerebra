import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantSidebarRightComponent} from "./voice-assistant-sidebar-right.component";

describe("VoiceAssistantSidebarRightComponent", () => {
    let component: VoiceAssistantSidebarRightComponent;
    let fixture: ComponentFixture<VoiceAssistantSidebarRightComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VoiceAssistantSidebarRightComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(VoiceAssistantSidebarRightComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
