import {Component, OnInit} from "@angular/core";
import {FormControl} from "@angular/forms";
import {ActivatedRoute, Params} from "@angular/router";
import {ChatService} from "src/app/shared/services/chat.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {Chat} from "src/app/shared/types/chat.class";

@Component({
    selector: "app-chat-window",
    templateUrl: "./chat-window.component.html",
    styleUrls: ["./chat-window.component.css"],
})
export class ChatWindowComponent implements OnInit {
    sendButton: string = "M120-160v-240l320-80-320-80v-240l760 320-760 320Z";
    chat?: Chat;
    promptFormControl: FormControl = new FormControl("");
    personalityName: string | undefined;
    constructor(
        private chatService: ChatService,
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.chat = this.route.snapshot.data["chat"];
        localStorage.setItem("chat", this.chat?.chatId ?? "");
        this.route.params.subscribe((params: Params) => {
            this.chat = this.chatService.getChat(params["chatUuid"]);
            localStorage.setItem("chat", this.chat?.chatId ?? "");
            if (this.chat) {
                this.personalityName =
                    this.voiceAssistantService.getPersonality(
                        this.chat?.personalityId,
                    )?.name;
            }
        });
    }

    sendMessage() {
        throw Error("not implemented");
    }

    exportChat() {
        throw Error("not implemented");
    }
}
