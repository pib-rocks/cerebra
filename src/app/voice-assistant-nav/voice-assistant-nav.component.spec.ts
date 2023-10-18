import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantNavComponent} from "./voice-assistant-nav.component";
import {RouterTestingModule} from "@angular/router/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {BoolToOnOffPipe} from "../shared/pipes/bool-to-on-off-pipe.pipe";

describe("VoiceAssistantNavComponent", () => {
    let component: VoiceAssistantNavComponent;
    let fixture: ComponentFixture<VoiceAssistantNavComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VoiceAssistantNavComponent, BoolToOnOffPipe],
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
