import {TestBed, waitForAsync} from "@angular/core/testing";
import {VoiceAssistantService} from "./voice-assistant.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {VoiceAssistant} from "../types/voice-assistant";
import {ApiService} from "./api.service";
import {BehaviorSubject} from "rxjs";
import {RosService} from "./ros-service/ros.service";
import {AssistantModel} from "../types/assistantModel";
import {DEFAULT_PROVIDER_REF} from "../types/provider-registry";
import {
    DIRECT_CHANNEL,
    SMART_CHANNEL,
    effectiveChannel,
} from "../types/channel-router";
import {UrlConstants} from "./url.constants";
import {ChatService} from "./chat.service";
import {ChannelCapabilityService} from "./channel-capability.service";

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

    it("parses registry fields and keeps rows the ui still has to filter", () => {
        const registry = new BehaviorSubject({
            assistantModels: [
                {
                    id: 8,
                    apiName: "shared-api",
                    visualName: "Text row",
                    hasImageSupport: false,
                    endpointBase: "https://example.test/v1",
                    capabilities: {
                        tools: true,
                        images: false,
                        live: false,
                        stt: false,
                        tts: false,
                    },
                    credentialRef: "provider-key",
                    isDefault: false,
                },
                {
                    id: 9,
                    apiName: "shared-api",
                    visualName: "Vision row",
                    hasImageSupport: true,
                    endpointBase: "https://example.test/v1",
                    capabilities: {
                        tools: true,
                        images: true,
                        live: true,
                        stt: false,
                        tts: false,
                    },
                    credentialRef: "provider-key",
                    isDefault: true,
                },
            ],
        });
        apiService.get.and.returnValue(registry);
        service.getAllAssistantModels();
        const parsed = service.assistantModelsSubject.getValue();
        expect(parsed.length).toBe(2);
        expect(parsed[0].capabilities.images).toBeFalse();
        expect(parsed[0].endpointBase).toBe("https://example.test/v1");
        expect(parsed[0].credentialRef).toBe("provider-key");
        expect(parsed[1].isDefault).toBeTrue();
        expect(parsed[1].capabilities.live).toBeTrue();
        expect(parsed[0].apiName).toBe(parsed[1].apiName);
        expect(parsed[0].retired).toBeFalse();
    });

    it("keeps a retired catalogue row so settings can name it", () => {
        apiService.get.and.returnValue(
            new BehaviorSubject({
                assistantModels: [
                    {
                        id: 1,
                        apiName: "gpt-4o",
                        visualName: "GPT-4o",
                        hasImageSupport: true,
                        capabilities: {
                            tools: true,
                            images: true,
                            live: false,
                            stt: false,
                            tts: false,
                        },
                        credentialRef: "provider-1",
                        isDefault: false,
                        retired: true,
                    },
                    {
                        id: 2,
                        apiName: "claude-sonnet-5-5",
                        visualName: "Claude Sonnet 5.5",
                        hasImageSupport: true,
                        capabilities: {
                            tools: true,
                            images: true,
                            live: false,
                            stt: false,
                            tts: false,
                        },
                        credentialRef: null,
                        isDefault: false,
                        status: "retired",
                    },
                ],
            }),
        );
        service.getAllAssistantModels();
        const parsed = service.assistantModelsSubject.getValue();
        expect(parsed.map((model) => model.visualName)).toEqual([
            "GPT-4o",
            "Claude Sonnet 5.5",
        ]);
        expect(parsed.every((model) => model.retired)).toBeTrue();
        service.setProviderCredential(1, null);
        expect(service.assistantModelsSubject.getValue()[0].retired).toBeTrue();
    });

    it("publishes a credential change on the model list immediately", () => {
        service.assistantModelsSubject.next(models.assistantModels);
        service.setProviderCredential(2, null);
        expect(
            service.assistantModelsSubject.getValue()[1].credentialRef,
        ).toBeNull();
        service.setProviderCredential(2, "provider-2");
        expect(service.assistantModelsSubject.getValue()[1].credentialRef).toBe(
            "provider-2",
        );
        expect(
            service.assistantModelsSubject.getValue()[0].credentialRef,
        ).toBeNull();
    });

    it("sends the default provider pointer when a personality has no model id", () => {
        apiService.post.and.returnValue(observableOfKlaus);
        service.createPersonality(klaus);
        expect(apiService.post).toHaveBeenCalledWith(
            UrlConstants.PERSONALITY,
            jasmine.objectContaining({
                providerRef: DEFAULT_PROVIDER_REF,
                assistantModelId: null,
                channel: SMART_CHANNEL,
            }),
        );
    });

    it("shows an existing Smart personality as Direct without rewriting its channel", () => {
        const capability = TestBed.inject(ChannelCapabilityService);
        const stored = {
            personalityId: "persona-smart",
            name: "Ada",
            gender: "Female",
            description: "Du bist pib.",
            pauseThreshold: 0.8,
            messageHistory: 10,
            providerRef: DEFAULT_PROVIDER_REF,
            channel: SMART_CHANNEL,
            effectiveChannel: DIRECT_CHANNEL,
            smartChatsEnabled: false,
        };
        apiService.get.and.returnValue(
            new BehaviorSubject({voiceAssistantPersonalities: [stored]}),
        );
        service.getAllPersonalities();

        expect(capability.smartChatsEnabled).toBeFalse();
        const loaded = service.getPersonality("persona-smart");
        expect(loaded?.channel).toBe(SMART_CHANNEL);
        expect(loaded?.description).toBe("Du bist pib.");
        expect(
            effectiveChannel(loaded?.channel, capability.smartChatsEnabled),
        ).toBe(DIRECT_CHANNEL);

        apiService.put.and.returnValue(
            new BehaviorSubject({
                ...stored,
                name: "Ada renamed",
            }),
        );
        loaded!.name = "Ada renamed";
        service.updatePersonalityById(loaded!);
        const body = apiService.put.calls.mostRecent().args[1] as {
            channel?: string;
            description?: string;
            name?: string;
        };
        expect(body.channel).toBeUndefined();
        expect(body.description).toBe("Du bist pib.");
        expect(body.name).toBe("Ada renamed");
        expect(service.getPersonality("persona-smart")?.channel).toBe(
            SMART_CHANNEL,
        );

        capability.applyInstallerFlag(true);
        expect(
            effectiveChannel(
                service.getPersonality("persona-smart")?.channel,
                capability.smartChatsEnabled,
            ),
        ).toBe(SMART_CHANNEL);
        apiService.put.and.returnValue(new BehaviorSubject(stored));
        service.updatePersonalityById(service.getPersonality("persona-smart")!);
        expect(
            (
                apiService.put.calls.mostRecent().args[1] as {
                    channel?: string;
                }
            ).channel,
        ).toBe(SMART_CHANNEL);
    });
});
