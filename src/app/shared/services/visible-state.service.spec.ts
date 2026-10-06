import {TestBed} from "@angular/core/testing";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {BehaviorSubject, of, Subject} from "rxjs";
import {MicrophoneArrayService} from "src/app/system/microphone-array/microphone-array.service";
import {DEGRADED_MODE} from "src/app/system/keys/key-store-session";
import {KeyStoreSessionService} from "src/app/system/keys/key-store-session.service";
import {AssistantModel} from "../types/assistantModel";
import {Chat} from "../types/chat.class";
import {ChatMessage} from "../ros-types/msg/chat-message";
import {ChatIsListening} from "../ros-types/msg/chat-is-listening";
import {capabilitiesFrom} from "../types/provider-registry";
import {VoiceAssistant} from "../types/voice-assistant";
import {LISTENING, SPEAKING, THINKING} from "../types/visible-state";
import {ChatService} from "./chat.service";
import {RosService} from "./ros-service/ros.service";
import {VisibleStateService} from "./visible-state.service";
import {VoiceAssistantService} from "./voice-assistant.service";

describe("VisibleStateService", () => {
    let service: VisibleStateService;
    let session: KeyStoreSessionService;
    let ros: jasmine.SpyObj<RosService>;
    let microphone: jasmine.SpyObj<MicrophoneArrayService>;
    const voiceState = new BehaviorSubject({turnedOn: false, chatId: ""});
    const personalities = new BehaviorSubject<VoiceAssistant[]>([]);
    const models = new BehaviorSubject<AssistantModel[]>([]);
    const chats = new BehaviorSubject<Chat[]>([]);
    const listening$ = new Subject<ChatIsListening>();
    const messages$ = new Subject<ChatMessage>();
    const telemetry = new BehaviorSubject({connectionState: "live" as const});

    const ada = new VoiceAssistant(
        "p-1",
        "Ada",
        "Female",
        0.8,
        "",
        1,
        10,
        "1",
        "smart",
        {live: true},
    );
    const textModel = new AssistantModel(
        1,
        "text-model",
        "Text",
        false,
        null,
        capabilitiesFrom({tools: true, live: false}, false),
        "key",
        true,
    );

    function message(isUser: boolean): ChatMessage {
        return {
            chat_id: "chat-1",
            message_id: "m-1",
            timestamp: "0",
            is_user: isUser,
            content: "hello",
        };
    }

    beforeEach(() => {
        voiceState.next({turnedOn: false, chatId: ""});
        personalities.next([ada]);
        models.next([textModel]);
        chats.next([new Chat("hello", "p-1", "chat-1")]);
        microphone?.updateTuning.calls?.reset();

        ros = jasmine.createSpyObj(
            "RosService",
            ["getChatIsListening", "publishExpression", "publishDisplayText"],
            {
                chatIsListeningReceiver$: listening$,
                chatMessageReceiver$: messages$,
            },
        );
        ros.getChatIsListening.and.returnValue(of(true));

        microphone = jasmine.createSpyObj("MicrophoneArrayService", [
            "connect",
            "getTelemetry",
            "getTuning",
            "updateTuning",
        ]);
        microphone.getTelemetry.and.returnValue(telemetry);
        microphone.getTuning.and.returnValue(of({ledMode: "mono"}));
        microphone.updateTuning.and.returnValue(of({ledMode: "listen"}));

        const voiceAssistant = jasmine.createSpyObj(
            "VoiceAssistantService",
            ["getPersonality"],
            {
                voiceAssistantStateObservable: voiceState,
                personalitiesSubject: personalities,
                assistantModelsSubject: models,
            },
        );
        const chatService = jasmine.createSpyObj("ChatService", [], {
            chatSubject: chats,
        });

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                VisibleStateService,
                {provide: RosService, useValue: ros},
                {provide: VoiceAssistantService, useValue: voiceAssistant},
                {provide: ChatService, useValue: chatService},
                {provide: MicrophoneArrayService, useValue: microphone},
            ],
        });
        service = TestBed.inject(VisibleStateService);
        session = TestBed.inject(KeyStoreSessionService);
    });

    it("drives listening, thinking and speaking from the two voice topics", () => {
        expect(service.snapshot.holderLine).toBe("Nobody holds the voice");
        expect(microphone.connect).not.toHaveBeenCalled();

        voiceState.next({turnedOn: true, chatId: "chat-1"});

        expect(service.snapshot.activity).toBe(LISTENING);
        expect(service.snapshot.holderLine).toBe("Ada holds the voice");
        expect(service.snapshot.fallback).toBeTrue();
        expect(ros.publishDisplayText).toHaveBeenCalledWith(
            "Listening · Ada · Fallback",
        );
        expect(microphone.connect).toHaveBeenCalled();
        expect(microphone.updateTuning).toHaveBeenCalledWith({
            led_ring: {mode: "listen"},
        });

        listening$.next({chat_id: "chat-1", listening: false});

        expect(service.snapshot.activity).toBe(THINKING);
        expect(ros.publishExpression).toHaveBeenCalledWith("thinking");
        expect(microphone.updateTuning).toHaveBeenCalledWith({
            led_ring: {mode: "think"},
        });

        messages$.next(message(false));

        expect(service.snapshot.activity).toBe(SPEAKING);
        expect(service.snapshot.mouthOpen).toBeTrue();
        expect(microphone.updateTuning).toHaveBeenCalledWith({
            led_ring: {mode: "speak"},
        });

        listening$.next({chat_id: "chat-1", listening: true});

        expect(service.snapshot.activity).toBe(LISTENING);
        expect(service.snapshot.mouthOpen).toBeFalse();
    });

    it("shows degraded from the key store in the same snapshot", () => {
        voiceState.next({turnedOn: true, chatId: "chat-1"});
        session.cancel();

        expect(session.mode).toBe(DEGRADED_MODE);
        expect(service.snapshot.degraded).toBeTrue();
        expect(service.snapshot.activity).toBe(LISTENING);
        expect(service.snapshot.displayText).toContain("Degraded");
        expect(service.snapshot.displayText).toContain("Fallback");
    });

    it("puts the previous LED mode back when the voice is released", () => {
        voiceState.next({turnedOn: true, chatId: "chat-1"});
        microphone.updateTuning.calls.reset();

        voiceState.next({turnedOn: false, chatId: ""});

        expect(service.snapshot.holderLine).toBe("Nobody holds the voice");
        expect(microphone.updateTuning).toHaveBeenCalledWith({
            led_ring: {mode: "mono"},
        });
    });
});
