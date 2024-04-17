import {Component, OnInit} from "@angular/core";
import {FormControl} from "@angular/forms";
import {ActivatedRoute, Params} from "@angular/router";
import {ChatService} from "src/app/shared/services/chat.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {ChatMessage} from "src/app/shared/types/chat-message";
import {Chat} from "src/app/shared/types/chat.class";
import {Observable, Subscription} from "rxjs";

@Component({
    selector: "app-chat-window",
    templateUrl: "./chat-window.component.html",
    styleUrls: ["./chat-window.component.css"],
})
export class ChatWindowComponent implements OnInit {
    chat?: Chat;
    promptFormControl: FormControl = new FormControl("");
    personalityName: string | undefined;
    messages?: ChatMessage[];
    messageObservable$: Subscription | undefined;

    chatMessageFormControl: FormControl<string> = new FormControl();

    textInputIsValid: boolean = false;
    active: boolean = false;
    listening: boolean = false;
    chatId?: string = "";

    readonly USER_ICON =
        "../../../../assets/voice-assistant-svgs/chat/user.svg";
    readonly VA_ICON =
        "../../../../assets/voice-assistant-svgs/chat/pib-icon-speaking.png";
    readonly arrow = "../../../../assets/voice-assistant-svgs/chat/arrow.svg";

    constructor(
        private chatService: ChatService,
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
    ) {
        this.chatMessageFormControl.valueChanges.subscribe((value) => {
            this.textInputIsValid = Boolean(value);
        });
    }

    ngOnInit(): void {
        // TODO: can this be removed
        // this.chat = this.route.snapshot.data["chat"];
        // localStorage.setItem("chat", this.chat?.chatId ?? "");

        this.route.params.subscribe((params: Params) => {
            this.messageObservable$?.unsubscribe();

            this.chatId = params["chatUuid"];
            if (!this.chatId) return;

            this.chatService
                .getIsListening(this.chatId)
                .subscribe((listening) => {
                    this.listening = listening;
                });

            this.chatService
                .getIsActive(this.chatId)
                .subscribe((active) => (this.active = active));

            this.messageObservable$ = this.chatService
                .getChatMessagesObservable(this.chatId)
                .subscribe((messages) => (this.messages = messages));

            this.chat = this.chatService.getChat(this.chatId);
            localStorage.setItem("chat", this.chat?.chatId ?? "");
            if (this.chat) {
                this.personalityName =
                    this.voiceAssistantService.getPersonality(
                        this.chat?.personalityId,
                    )?.name;
            }
        });
    }

    sendChatMessage(content: string) {
        if (!this.chatId) return;
        this.chatService
            .sendChatMessage(this.chatId, content)
            .subscribe(() => this.chatMessageFormControl.setValue(""));
    }
}
