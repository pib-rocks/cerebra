import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantNavComponent} from "./voice-assistant-nav.component";
import {RouterTestingModule} from "@angular/router/testing";
import {ReactiveFormsModule} from "@angular/forms";

describe("VoiceAssistantNavComponent", () => {
    let component: VoiceAssistantNavComponent;
    let fixture: ComponentFixture<VoiceAssistantNavComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VoiceAssistantNavComponent],
            imports: [RouterTestingModule, ReactiveFormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(VoiceAssistantNavComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
