import {ComponentFixture, TestBed} from "@angular/core/testing";

import {PersonalityDescriptionComponent} from "./personality-description.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {BehaviorSubject} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";

describe("PersonalityDescriptionComponent", () => {
    let component: PersonalityDescriptionComponent;
    let fixture: ComponentFixture<PersonalityDescriptionComponent>;
    const paramsSubject = new BehaviorSubject({
        uuid: "right",
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PersonalityDescriptionComponent],
            imports: [HttpClientTestingModule, FormsModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            data: {
                                personality: "12345",
                            },
                        },
                        params: paramsSubject,
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PersonalityDescriptionComponent);
        component = fixture.componentInstance;
        component.personality = new VoiceAssistant(
            "",
            "Test",
            "Male",
            0.3,
            "Testdesc2",
        );
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should call updateDescription when clicking on the save-button", () => {
        const button: HTMLElement | null =
            document.getElementById("save-button");
        const spyUpdateDescription = spyOn(component, "updateDescription");
        button?.click();
        expect(spyUpdateDescription).toHaveBeenCalled();
    });

    it("should change the description of the personality when calling updateDescription", () => {
        const spyUpdateDescription = spyOn(
            component,
            "updateDescription",
        ).and.callThrough();
        component.personality = new VoiceAssistant(
            "",
            "Test",
            "Male",
            0.3,
            "Testdesc2",
        );
        component.textAreaContent = "Testdesc2";
        component.updateDescription();
        expect(spyUpdateDescription).toHaveBeenCalled();
        expect(component.personality.description).toBe("Testdesc2");
    });

    it("should call exportDescriptionAs when clicking on the save-as-button", () => {
        const button: HTMLElement | null =
            document.getElementById("save-as-button");
        const spyUpdateDescription = spyOn(component, "exportDescriptionAs");
        button?.click();
        expect(spyUpdateDescription).toHaveBeenCalled();
    });
});
