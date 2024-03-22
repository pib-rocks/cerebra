import {ComponentFixture, TestBed} from "@angular/core/testing";

import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject, Subject} from "rxjs";
import {RouterTestingModule} from "@angular/router/testing";
import {ChatService} from "src/app/shared/services/chat.service";
import {VoiceAssistantPersonalitySidebarRightComponent} from "./voice-assistant-personality-sidebar-right.component";
import {
    FormGroup,
    FormControl,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";

describe("VoiceAssistantPersonalitySidebarRightComponent", () => {
    let component: VoiceAssistantPersonalitySidebarRightComponent;
    let fixture: ComponentFixture<VoiceAssistantPersonalitySidebarRightComponent>;
    let chatService: jasmine.SpyObj<ChatService>;
    let paramsSubject: Subject<{chatUuid: string}>;

    beforeEach(async () => {
        paramsSubject = new BehaviorSubject<{chatUuid: string}>({chatUuid: ""});

        const chatServiceSpy: jasmine.SpyObj<ChatService> =
            jasmine.createSpyObj(ChatService, [
                "getChatMessagesObservable",
                "getChat",
            ]);
        await TestBed.configureTestingModule({
            declarations: [VoiceAssistantPersonalitySidebarRightComponent],
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,
                FormsModule,
                ReactiveFormsModule,
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
                    provide: ChatService,
                    useValue: chatServiceSpy,
                },
            ],
        }).compileComponents();

        chatService = TestBed.inject(
            ChatService,
        ) as jasmine.SpyObj<ChatService>;

        fixture = TestBed.createComponent(
            VoiceAssistantPersonalitySidebarRightComponent,
        );
        component = fixture.componentInstance;
        component.personalityClone = new VoiceAssistant(
            "id-1",
            "unit-test",
            "male",
            0.8,
            "You are a test roboter",
        );
        component.personalityFormSidebar = new FormGroup({
            "persona-name": new FormControl(component.personalityClone.name, {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(255),
                ],
            }),
            gender: new FormControl(component.personalityClone.gender, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            pausethreshold: new FormControl(
                component.personalityClone.pauseThreshold,
                {
                    nonNullable: true,
                    validators: [
                        Validators.required,
                        Validators.min(0.1),
                        Validators.max(3.0),
                    ],
                },
            ),
        });
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    //Test für
    //adjustThreshold
    // it("should test if adjustThreshold sets the pausethreshold correctly", () =>{
    //     component.thresholdString = "0.7"
    //     component.adjustThreshold("0.1")
    //     expect(component.thresholdString).toBe("0.9")
    // });
    //deletePersonality
    //updateForm
    //updatePersonality
});
