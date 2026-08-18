import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {PersonalityDescriptionComponent} from "./personality-description.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {BehaviorSubject, Subject} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {RouterTestingModule} from "@angular/router/testing";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {VoiceAssistantPersonalitySidebarRightComponent} from "./voice-assistant-personality-sidebar-right/voice-assistant-personality-sidebar-right.component";
import {VoiceAssistantNavComponent} from "../voice-assistant-nav/voice-assistant-nav.component";
import {MarkdownModule} from "ngx-markdown";
import {AssistantModel} from "src/app/shared/types/assistantModel";

describe("PersonalityDescriptionComponent", () => {
    let component: PersonalityDescriptionComponent;
    let fixture: ComponentFixture<PersonalityDescriptionComponent>;

    let _voiceAssistantService: jasmine.SpyObj<VoiceAssistantService>;

    let _fakePersonality: VoiceAssistant;

    let _router: Router;
    let paramsSubject: Subject<{personalityUuid: string}>;

    beforeEach(async () => {
        paramsSubject = new BehaviorSubject({
            personalityUuid: "01234567-0123-0123-0123-0123456789ab",
        });
        const voiceAssistantServiceSpy: jasmine.SpyObj<VoiceAssistantService> =
            jasmine.createSpyObj("VoiceAssistantService", [
                "getPersonality",
                "updatePersonalityById",
                "deletePersonalityById",
                "getAllPersonalities",
            ]);
        voiceAssistantServiceSpy.getPersonality.and.returnValue(
            new VoiceAssistant(
                "01234567-0123-0123-0123-0123456789ab",
                "FakeName",
                "Female",
                1.5,
                "FakeDescription",
            ),
        );
        voiceAssistantServiceSpy.personalitiesSubject = new BehaviorSubject<
            VoiceAssistant[]
        >([]);
        voiceAssistantServiceSpy.assistantModelsSubject = new BehaviorSubject<
            AssistantModel[]
        >([{id: "123", name: "TestModel"} as unknown as AssistantModel]);

        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                FormsModule,
                RouterTestingModule,
                VoiceAssistantNavComponent,
                VoiceAssistantPersonalitySidebarRightComponent,
                MarkdownModule.forRoot(),
            ],
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
                {
                    provide: VoiceAssistantService,
                    useValue: voiceAssistantServiceSpy,
                },
                {
                    provide: Router,
                    useValue: {
                        get url() {
                            return "/test-url";
                        },
                    },
                },
            ],
        }).compileComponents();
        _voiceAssistantService = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        _router = TestBed.inject(Router);
        fixture = TestBed.createComponent(PersonalityDescriptionComponent);
        component = fixture.componentInstance;
        _fakePersonality = new VoiceAssistant(
            "1234",
            "fakePersonality",
            "Female",
            0.8,
            "Fake test personality",
        );
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

    it("saves the SOUL text after the debounce", fakeAsync(() => {
        const personality = new VoiceAssistant(
            "1234",
            "fakePersonality",
            "Female",
            0.8,
            "old soul",
        );
        component.personality = personality;
        component.textAreaContent = "Du bist pib.";
        component.updateDescription();
        tick(1000);
        expect(_voiceAssistantService.updatePersonalityById).toHaveBeenCalled();
        expect(personality.description).toBe("Du bist pib.");
    }));
});
