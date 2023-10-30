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
                        personalities: [
                            {
                                personalityId: "ID-1",
                                name: "Eva",
                                gender: "Female",
                                pauseThreshold: 0.8,
                            },
                            {
                                personalityId: "ID-2",
                                name: "Thomas",
                                gender: "Male",
                                pauseThreshold: 0.8,
                            },
                        ],
                        personalitiesSubject: new BehaviorSubject<
                            VoiceAssistant[]
                        >([]),
                        lastSelectedIdSubject: new BehaviorSubject<string>(""),
                        createPersonality: () => {},
                        updatePersonality: () => {},
                        deletePersonalityById: () => {},
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

    it("should call the createPersonality method in voice assistant service when 'ADD' modal is closed", () => {
        const callCreatePersonality = spyOn(
            voiceAssistantService,
            "createPersonality",
        );

        spyOn(modalService, "open").and.returnValue({
            result: {
                then: (resolve, reject) => reject?.(undefined),
            } as Promise<any>,
        } as NgbModalRef);

        spyOn<any>(component, "allInputsValid").and.returnValue(true);

        const personality: VoiceAssistant = {
            personalityId: "",
            name: "Test",
            gender: "male",
            pauseThreshold: 0.8,
            description: "",
        };

        spyOn<any>(
            component,
            "createVoiceAssistantRequestObject",
        ).and.returnValue(personality);

        component.executeSidebarHeaderButtonFunctionality("ADD");
        expect(callCreatePersonality).toHaveBeenCalledWith(personality);
    });

    it("should call the updatePersonality method in voice assistant service when 'EDIT' modal is closed", async () => {
        const callUpdatePersonality = spyOn(
            voiceAssistantService,
            "updatePersonality",
        );

        spyOn(modalService, "open").and.returnValue({
            result: {
                then: (resolve, reject) => reject?.(undefined),
            } as Promise<any>,
        } as NgbModalRef);

        spyOn<any>(component, "allInputsValid").and.returnValue(true);

        const personality: VoiceAssistant = {
            personalityId: "ID-1",
            name: "Test",
            gender: "male",
            pauseThreshold: 0.8,
            description: "",
        };

        spyOn<any>(
            component,
            "createVoiceAssistantRequestObject",
        ).and.returnValue(personality);

        component.executeSidebarHeaderButtonFunctionality("EDIT");
        expect(callUpdatePersonality).toHaveBeenCalledWith(personality);
    });

    it("should load an empty modal when add button is clicked", () => {
        spyOn<any>(component, "showModal").and.returnValue({
            result: {
                then: (resolve, reject) => {},
            } as Promise<any>,
        } as NgbModalRef);
        const prepareAdd = spyOn<any>(
            component,
            "prepareAddFormControl",
        ).and.callThrough();
        component.executeSidebarHeaderButtonFunctionality("ADD");
        expect(prepareAdd).toHaveBeenCalled();
        expect(component.nameFormControl.value).toEqual("");
        expect(component.genderFormControl.value).toEqual("");
        expect(component.descriptionFormControl.value).toEqual("");
        expect(component.pauseThresholdFormControl.value).toEqual(0);
        expect(component.thresholdString).toEqual("");
    });

    it("should load an empty modal when add button is clicked", () => {
        const personality: VoiceAssistant = {
            personalityId: "ID-1",
            name: "Test",
            gender: "male",
            pauseThreshold: 0.8,
            description: "",
        };
        component.activePersonality = personality;
        spyOn<any>(component, "showModal").and.returnValue({
            result: {
                then: (resolve, reject) => {},
            } as Promise<any>,
        } as NgbModalRef);
        const prepareEdit = spyOn<any>(
            component,
            "prepareEditFormControl",
        ).and.callThrough();
        component.executeSidebarHeaderButtonFunctionality("EDIT");
        expect(prepareEdit).toHaveBeenCalled();
        expect(component.nameFormControl.value).toEqual(personality.name);
        expect(component.genderFormControl.value).toEqual(personality.gender);
        expect(component.descriptionFormControl.value).toEqual(
            personality.description,
        );
        expect(component.pauseThresholdFormControl.value).toEqual(
            personality.pauseThreshold,
        );
    });

    it("should call the deletePersonality method in voice assistant service when 'DELETE' modal is closed", () => {
        const callDeletePersonality = spyOn(
            voiceAssistantService,
            "deletePersonalityById",
        );
        const activePersonality: VoiceAssistant = {
            personalityId: "ID-1",
            name: "Test",
            gender: "male",
            pauseThreshold: 0.8,
            description: "",
        };
        component.activePersonality = activePersonality;

        component.executeSidebarHeaderButtonFunctionality("DELETE");
        expect(callDeletePersonality).toHaveBeenCalledWith(
            activePersonality.personalityId,
        );
    });

    it(
        "should activate personality in component correctly and set the value" +
            "of the corresponding lastActivePersonality BehaviorSubject with the id of the active personality",
        () => {
            const spyLastSelectedId = spyOn(
                voiceAssistantService.lastSelectedIdSubject,
                "next",
            );
            const spySetPauseThreshold = spyOn<any>(
                component,
                "setPauseThresholdString",
            ).and.callThrough();

            component.personalities = [
                {
                    id: "ID-1",
                    name: "Eva",
                    selected: true,
                    hovered: false,
                },
                {
                    id: "ID-2",
                    name: "Thomas",
                    selected: false,
                    hovered: false,
                },
            ];
            component.activePersonality = {
                personalityId: "ID-1",
                name: "Eva",
                gender: "Female",
                pauseThreshold: 0.8,
            } as VoiceAssistant;

            component.activateNewPersonality("ID-2");
            expect(component.activePersonality?.personalityId).toEqual("ID-2");
            expect(component.personalities[0].selected).toBeFalse();
            expect(component.personalities[1].selected).toBeTrue();
            expect(component.activePersonality).toEqual(
                jasmine.objectContaining({
                    name: "Thomas",
                    personalityId: "ID-2",
                }),
            );
            expect(spyLastSelectedId).toHaveBeenCalledOnceWith("ID-2");
            expect(spySetPauseThreshold).toHaveBeenCalled();
            expect(component.thresholdString).toEqual("0.8s");
        },
    );
});
