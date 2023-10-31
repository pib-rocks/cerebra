import {ComponentFixture, TestBed} from "@angular/core/testing";
import {VoiceAssistantPersonalityComponent} from "./voice-assistant-personality.component";
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
            providers: [
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
            result: Promise.resolve(),
        } as NgbModalRef);
        component.executeSidebarHeaderButtonFunctionality("ADD");
        expect(openCalled).toHaveBeenCalled();
    });

    it("should show a modal when 'EDIT' button is clicked", () => {
        const openCalled = spyOn(modalService, "open").and.returnValue({
            result: Promise.resolve(),
        } as NgbModalRef);
        component.executeSidebarHeaderButtonFunctionality("EDIT");
        expect(openCalled).toHaveBeenCalled();
    });

    it("should call the createPersonality method in voice assistant service when 'ADD' modal is closed", () => {
        const callCreatePersonality = spyOn(
            voiceAssistantService,
            "createPersonality",
        );

        const personality: VoiceAssistant = {
            personalityId: "",
            name: "Test",
            gender: "male",
            pauseThreshold: 0.8,
            description: "",
        };
        spyOn(modalService, "open").and.returnValue({
            result: {
                then: (resolve, reject) => resolve?.(personality),
            } as Promise<any>,
        } as NgbModalRef);

        spyOn<any>(component, "allInputsValid").and.returnValue(true);

        component.executeSidebarHeaderButtonFunctionality("ADD");
        expect(callCreatePersonality).toHaveBeenCalledWith(personality);
    });

    it("should call the updatePersonality method in voice assistant service when 'EDIT' modal is closed", async () => {
        const callUpdatePersonality = spyOn<any>(
            voiceAssistantService,
            "updatePersonality",
        );

        const personality: VoiceAssistant = {
            personalityId: "ID-1",
            name: "Test",
            gender: "male",
            pauseThreshold: 0.8,
            description: "",
        };
        spyOn(modalService, "open").and.returnValue({
            result: {
                then: (resolve, reject) => resolve?.(personality),
            } as Promise<any>,
        } as NgbModalRef);

        spyOn<any>(component, "allInputsValid").and.returnValue(true);

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
        expect(component.descriptionFormControl.value).toEqual(null);
        expect(component.pauseThresholdFormControl.value).toEqual(0);
        expect(component.thresholdString).toEqual("");
    });

    it("should not load an empty modal when edit button is clicked", () => {
        const personality: VoiceAssistant = {
            personalityId: "ID-1",
            name: "Test",
            gender: "male",
            pauseThreshold: 0.8,
            description: null,
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
