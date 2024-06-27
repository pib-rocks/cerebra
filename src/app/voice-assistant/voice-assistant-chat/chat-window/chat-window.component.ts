import {Component, OnInit} from "@angular/core";
import {FormControl} from "@angular/forms";
import {ActivatedRoute, Params} from "@angular/router";
import {ChatService} from "src/app/shared/services/chat.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {ChatMessage} from "src/app/shared/types/chat-message";
import {Chat} from "src/app/shared/types/chat.class";
import {Subscription, combineLatest, map} from "rxjs";

@Component({
    selector: "app-chat-window",
    templateUrl: "./chat-window.component.html",
    styleUrls: ["./chat-window.component.scss"],
})
export class ChatWindowComponent implements OnInit {
    chat?: Chat;
    personalityName: string | undefined;
    messages?: ChatMessage[];
    extendedMessages?: ChatMessage[];

    chatMessagesSubscription: Subscription | undefined;
    chatMessagesUpdateSubscription: Subscription | undefined;
    textInputActiveSubscription: Subscription | undefined;

    chatMessageFormControl: FormControl<string> = new FormControl();

    textInputActive = false;

    readonly USER_ICON =
        "../../../../assets/voice-assistant-svgs/chat/user.svg";
    readonly VA_ICON =
        "../../../../assets/voice-assistant-svgs/chat/pib-icon-speaking.png";
    readonly arrow = "../../../../assets/voice-assistant-svgs/chat/arrow.svg";

    constructor(
        private chatService: ChatService,
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            this.chatMessagesSubscription?.unsubscribe();
            this.chatMessagesUpdateSubscription?.unsubscribe();
            this.textInputActiveSubscription?.unsubscribe();

            const chatId = params["chatUuid"];
            if (!chatId) return;

            this.textInputActiveSubscription = combineLatest([
                this.chatMessageFormControl.valueChanges,
                this.chatService.getIsListeningObservable(chatId),
            ]).subscribe(([inputText, isListening]) => {
                this.textInputActive = Boolean(inputText && isListening);
            });

            this.chatMessagesSubscription = this.chatService
                .getChatMessagesObservable(chatId)
                .pipe(map((messages) => messages))
                .subscribe(
                    (messages) =>
                        (this.messages = messages
                            .filter((message, index, messages) => {
                                if (index + 1 >= messages.length) {
                                    return true;
                                }
                                if (
                                    message.messageId ==
                                    messages[index + 1].messageId
                                ) {
                                    return false;
                                }
                                return true;
                            })
                            .slice()
                            .reverse()),
                );

            this.chat = this.chatService.getChat(chatId);
            if (this.chat) {
                this.personalityName =
                    this.voiceAssistantService.getPersonality(
                        this.chat?.personalityId,
                    )?.name;
            }
        });
    }

    sendChatMessage() {
        if (this.chat && this.textInputActive) {
            this.chatService
                .sendChatMessage(
                    this.chat.chatId,
                    this.chatMessageFormControl.value,
                )
                .subscribe(() => this.chatMessageFormControl.setValue(""));
        }
    }
}
