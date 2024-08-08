import {TestBed, waitForAsync} from "@angular/core/testing";
import {VoiceAssistantService} from "./voice-assistant.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {VoiceAssistant} from "../types/voice-assistant";
import {ApiService} from "./api.service";
import {BehaviorSubject} from "rxjs";
import {RosService} from "./ros-service/ros.service";
import {AssistantModel} from "../types/assistantModel";
import {ChatService} from "./chat.service";

describe("VoiceAssistantService", () => {
    let service: VoiceAssistantService;
    let apiService: jasmine.SpyObj<ApiService>;
    let rosService: jasmine.SpyObj<RosService>;
    let chatService: jasmine.SpyObj<ChatService>;
    const eva = {
        personalityId: "8f73b580-927e-41c2-98ac-e5df070e7288",
        name: "Eva",
        gender: "Female",
        description: "",
        pauseThreshold: 0.8,
    } as VoiceAssistant;
    const thomas = {
        personalityId: "8b310f95-92cd-4512-b42a-d3fe29c4bb8a",
        name: "Thomas",
        gender: "Male",
        description: "",
        pauseThreshold: 0.8,
    } as VoiceAssistant;
    const klaus = new VoiceAssistant(
        "8f73b580-927e-41c2-98ac-e5df070e7222",
        "klaus",
        "Male",
        0.8,
        "",
    );

    const res = {voiceAssistantPersonalities: [eva, thomas]};
    const observableOfKlaus = new BehaviorSubject<VoiceAssistant>(klaus);
    const observableOfTwo = new BehaviorSubject<{
        voiceAssistantPersonalities: VoiceAssistant[];
    }>(res);
    const models = {
        assistantModels: [
            new AssistantModel(1, "gpt-3.5-turbo", "GPT-3.5 Turbo", false),
            new AssistantModel(2, "claude-3-sonnet", "Claude 3 Sonnet", true),
        ],
    };
    const observableModels = new BehaviorSubject<{
        assistantModels: AssistantModel[];
    }>(models);

    beforeEach(() => {
        const rosServiceSpy: jasmine.SpyObj<RosService> = jasmine.createSpyObj(
            "RosService",
            ["setVoiceAssistantState"],
            {
                voiceAssistantStateReceiver$: new BehaviorSubject({
                    turned_on: false,
                    chat_id: "",
                }),
            },
        );
        const apiServiceSpy: jasmine.SpyObj<ApiService> = jasmine.createSpyObj(
            "ApiService",
            ["get", "delete", "put", "post"],
        );

        apiServiceSpy.get.and.returnValue(
            new BehaviorSubject({voiceAssistantPersonalities: []}),
        );

        const chatServiceSpy: jasmine.SpyObj<ChatService> =
            jasmine.createSpyObj("ChatService", ["createChat"]);

        TestBed.configureTestingModule({
            providers: [
                VoiceAssistantService,
                {
                    provide: RosService,
                    useValue: rosServiceSpy,
                },
                {
                    provide: ApiService,
                    useValue: apiServiceSpy,
                },
                {provide: ChatService, useValue: chatServiceSpy},
            ],
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(VoiceAssistantService);
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        rosService = TestBed.inject(RosService) as jasmine.SpyObj<RosService>;
        chatService = TestBed.inject(
            ChatService,
        ) as jasmine.SpyObj<ChatService>;
        apiService.get = jasmine.createSpy();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should return all personalities from database", () => {
        apiService.get.and.returnValue(observableOfTwo);
        service.getAllPersonalities();
        expect(apiService.get).toHaveBeenCalled();
        expect(service.personalitiesSubject.getValue().length).toBe(2);
        expect(service.personalities.length).toBe(2);
    });

    it("should return a created personality from db", () => {
        apiService.post.and.returnValue(observableOfKlaus);
        service.createPersonality(klaus);
        const index = service.personalities.findIndex(
            (i) => i.personalityId === klaus.personalityId,
        );
        expect(apiService.post).toHaveBeenCalled();
        expect(service.personalities[index].description).toBe(
            klaus.description,
        );
        expect(service.personalities[index].pauseThreshold).toBe(
            klaus.pauseThreshold,
        );
        expect(service.personalities[index].name).toBe(klaus.name);
        expect(service.personalities[index].personalityId).toBe(
            klaus.personalityId,
        );
        expect(chatService.createChat).toHaveBeenCalled();
    });

    it("should return an updated personality from db", () => {
        const evaUpdate = eva;
        evaUpdate.description = "asdasdadasd";
        const observableOfUpdatedEva = new BehaviorSubject<VoiceAssistant>(
            evaUpdate,
        );
        apiService.put.and.returnValue(observableOfUpdatedEva);
        service.updatePersonalityById(evaUpdate);
        expect(apiService.put).toHaveBeenCalled();
    });

    it("should return 204", () => {
        const emptyObservable = new BehaviorSubject<any>(undefined);
        apiService.delete.and.returnValue(emptyObservable);
        service.deletePersonalityById(eva.personalityId);
        expect(apiService.delete).toHaveBeenCalled();
    });

    it("should set the state of the voice assistant", () => {
        service.setVoiceAssistantState({
            turnedOn: true,
            chatId: "test-chat-id",
        });
        expect(rosService.setVoiceAssistantState).toHaveBeenCalledOnceWith({
            turned_on: true,
            chat_id: "test-chat-id",
        });
    });

    it("should be subscribed to the voice-assistant-state-receiver in the ros-service", waitForAsync(() => {
        let state = {turnedOn: true, chatId: "original-chat-id"};
        const expectedState = {turnedOn: false, chatId: "next-chat-id"};
        service.voiceAssistantStateObservable.subscribe(
            (nextState) => (state = nextState),
        );
        rosService.voiceAssistantStateReceiver$.next({
            turned_on: false,
            chat_id: "next-chat-id",
        });
        expect(state).toEqual(jasmine.objectContaining(expectedState));
    }));

    it("should save a behavior subject to a local var", waitForAsync(() => {
        apiService.get.and.returnValue(observableModels);
        service.getAllAssistantModels();
        expect(apiService.get).toHaveBeenCalled();
        expect(service.assistantModelsSubject.getValue().length).toBe(2);
    }));
});
