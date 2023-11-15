import {Component} from "@angular/core";

@Component({
    selector: "app-chat-window",
    templateUrl: "./chat-window.component.html",
    styleUrls: ["./chat-window.component.css"],
})
export class ChatWindowComponent {
    sendButton: string = "M120-160v-240l320-80-320-80v-240l760 320-760 320Z";
}
