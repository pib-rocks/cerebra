import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantPersonalityComponent} from "./voice-assistant-personality.component";
import {VoiceAssistantNavComponent} from "../voice-assistant-nav/voice-assistant-nav.component";
import {VoiceAssistantSidebarRightComponent} from "../voice-assistant-sidebar-right/voice-assistant-sidebar-right.component";
import {RouterTestingModule} from "@angular/router/testing";
import {NgControl, ReactiveFormsModule} from "@angular/forms";
import {HttpClient, HttpHandler} from "@angular/common/http";
import {VoiceAssistant} from "../shared/types/voice-assistant";
import {VoiceAssistantService} from "../shared/services/voice-assistant.service";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {BehaviorSubject} from "rxjs";

describe("VoiceAssistantPersonalityComponent", () => {
    let component: VoiceAssistantPersonalityComponent;
    let fixture: ComponentFixture<VoiceAssistantPersonalityComponent>;

    let voiceAssistantService: VoiceAssistantService;
    let activePersonality: VoiceAssistant;
    let personalities;
    let modalService: NgbModal;
    beforeEach(async () => {
        personalities = [
            {
                id: "ID-1",
                name: "Eva",
                active: true,
                hovered: false,
            },
            {
                id: "ID-2",
                name: "Thomas",
                active: false,
                hovered: false,
            },
        ];
        activePersonality = {
            personalityId: "ID-1",
            name: "Eva",
            gender: "Female",
            pauseThreshold: 0.8,
        } as VoiceAssistant;

        await TestBed.configureTestingModule({
            declarations: [
                VoiceAssistantPersonalityComponent,
                VoiceAssistantNavComponent,
                VoiceAssistantSidebarRightComponent,
            ],
            imports: [RouterTestingModule, ReactiveFormsModule],
            providers: [
                HttpClient,
                HttpHandler,
                NgControl,
                NgbModal,
                VoiceAssistantService,
                {
                    provide: VoiceAssistantService,
                    useValue: {
                        personalitiesSubject: new BehaviorSubject<
                            VoiceAssistant[]
                        >([]),
                        lastSelectedIdSubject: new BehaviorSubject<string>(""),
                        createPersonality: () => {},
                        updatePersonality: () => {},
                        deletePersonality: () => {},
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VoiceAssistantPersonalityComponent);
        component = fixture.componentInstance;
        modalService = TestBed.inject(NgbModal);
        voiceAssistantService = TestBed.inject(VoiceAssistantService);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should show a modal when 'ADD' button is clicked", () => {
        const openCalled = spyOn(modalService, "open").and.returnValue({
            result: Promise.reject(),
        } as NgbModalRef);
        component.executeSidebarHeaderButtonFunctionality("ADD");
        expect(openCalled).toHaveBeenCalled();
    });

    it("should show a modal when 'EDIT' button is clicked", () => {
        const openCalled = spyOn(modalService, "open").and.returnValue({
            result: Promise.reject(),
        } as NgbModalRef);
        component.executeSidebarHeaderButtonFunctionality("EDIT");
        expect(openCalled).toHaveBeenCalled();
    });

    it("should call the createPersonality method in voice assistant service when 'ADD' modal is closed", async () => {
        const callCreatePersonality = spyOn(
            voiceAssistantService,
            "createPersonality",
        );
        const promise: Promise<any> = new Promise((resolve, reject) => {
            spyOn(modalService, "open").and.returnValue({
                result: Promise.reject(),
            } as NgbModalRef);

            spyOn<any>(component, "allInputsValid").and.returnValue(true);
            spyOn<any>(
                component,
                "createVoiceAssistantRequestObject",
            ).and.returnValue({
                id: "",
                name: "Test",
            });
            callCreatePersonality.and.callFake(() => resolve({}));
            component.executeSidebarHeaderButtonFunctionality("ADD");
            setTimeout(() => reject({}), 1000);
        });
        await promise;
        expect(callCreatePersonality).toHaveBeenCalled();
    });

    it("should call the updatePersonality method in voice assistant service when 'EDIT' modal is closed", async () => {
        const callUpdatePersonality = spyOn(
            voiceAssistantService,
            "updatePersonality",
        );
        const promise: Promise<any> = new Promise((resolve, reject) => {
            spyOn(modalService, "open").and.returnValue({
                result: Promise.reject(),
            } as NgbModalRef);

            spyOn<any>(component, "allInputsValid").and.returnValue(true);
            spyOn<any>(
                component,
                "createVoiceAssistantRequestObject",
            ).and.returnValue({
                id: "",
                name: "Test",
            });
            callUpdatePersonality.and.callFake(() => resolve({}));
            component.executeSidebarHeaderButtonFunctionality("EDIT");
            setTimeout(() => reject({}), 1000);
        });
        await promise;
        expect(callUpdatePersonality).toHaveBeenCalled();
    });

    it("should call the deletePersonality method in voice assistant service when 'DELETE' modal is closed", () => {});

    /*
    it("should show modal with values from form control when edit button is clicked", () => {
        const element = component.genderFormControl.value;
        component.executeSidebarHeaderButtonFunctionality('EDIT');

    });

    it("should load an empty modal when add button is clicked", () => {

    });

    it("should call the createPersonality method in voice assistant service when 'ADD' modal is closed", () => {
        
    });

    it("should call the updatePersonality method in voice assistant service when 'EDIT' modal is closed", () => {
        
    });*/
});
