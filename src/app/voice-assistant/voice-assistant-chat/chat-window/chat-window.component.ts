import {Component, OnInit} from "@angular/core";
import {FormControl} from "@angular/forms";
import {ActivatedRoute, Params} from "@angular/router";
import {throwError} from "rxjs";
import {ChatService} from "src/app/shared/services/chat.service";
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

    constructor(
        private chatService: ChatService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.chat = this.route.snapshot.data["chat"];
        localStorage.setItem("chat", this.chat?.chatId ?? "");
        this.route.params.subscribe((params: Params) => {
            this.chat = this.chatService.getChat(params["uuid"]);
            localStorage.setItem("chat", this.chat?.chatId ?? "");
        });
    }

    sendMessage() {
        throw Error("not implemented");
    }
}
