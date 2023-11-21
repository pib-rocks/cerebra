import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {Observable} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {ChatService} from "src/app/shared/services/chat.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {ChatDto} from "src/app/shared/types/chat.class";

@Component({
    selector: "app-voice-assistant-chat",
    templateUrl: "./voice-assistant-chat.component.html",
    styleUrls: ["./voice-assistant-chat.component.css"],
})
export class VoiceAssistantChatComponent implements OnInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    ngbModalRef?: NgbModalRef;
    personalityIcon: string = "../../assets/voice-assistant-svgs/chat/chat.svg";
    topicFormControl: FormControl = new FormControl("");
    subject!: Observable<SidebarElement[]>;
    personalityId?: string | null;
    uuid: string | undefined;

    constructor(
        private modalService: NgbModal,
        private router: Router,
        private chatService: ChatService,
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        localStorage.setItem("voice-assistant-tab", "chat");
        if (localStorage.getItem("personality")) {
            this.personalityId = localStorage.getItem("personality");
        } else if (this.uuid) {
            this.personalityId = this.chatService.getChat(this.uuid)
                ?.personalityId;
        } else if (this.voiceAssistantService.personalities.length > 0) {
            this.personalityId =
                this.voiceAssistantService.personalities[0].clone().personalityId;
        }
        if (this.personalityId) {
            this.subject = this.chatService.getSubject(this.personalityId);
        }

        this.topicFormControl.setValidators([
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(255),
        ]);
    }

    showModal = () => {
        return (this.ngbModalRef = this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            windowClass: "myCustomModalClass",
            backdropClass: "myCustomBackdropClass",
        }));
    };

    openAddModal = () => {
        this.topicFormControl.setValue("");
        this.showModal();
    };

    openEditModal = () => {
        this.uuid = this.router.url.split("/").pop();
        console.log(this.uuid);
        if (this.uuid) {
            const updateChat = this.chatService.getChat(this.uuid);
            this.topicFormControl.setValue(updateChat?.topic ?? "");
            this.showModal();
        }
    };

    addChat() {
        if (this.personalityId) {
            this.chatService.createChat(
                new ChatDto(this.topicFormControl.value, this.personalityId),
            );
            this.ngbModalRef?.close("saved");
        } else {
            this.ngbModalRef?.close("failed");
        }
    }

    editChat = () => {
        if (this.uuid) {
            const updateChat = this.chatService.getChat(this.uuid)?.clone();
            console.log(updateChat);
            if (updateChat) {
                updateChat.topic = this.topicFormControl.value;
                this.chatService.updateChatById(updateChat);
                this.ngbModalRef?.close("edited");
                this.uuid = undefined;
            }
        }
    };

    saveChat() {
        if (this.topicFormControl.valid) {
            if (this.uuid) {
                this.editChat();
            } else {
                this.addChat();
            }
        }
    }

    closeModal = () => {
        this.ngbModalRef?.close("cancelled");
        this.uuid = undefined;
    };

    deleteChat = () => {
        this.uuid = this.router.url.split("/").pop();
        if (this.uuid) {
            this.chatService.deleteChatById(this.uuid);
            this.router.navigate(
                [
                    this.chatService.chats[0].chatId === this.uuid
                        ? this.chatService.chats[1].chatId
                        : this.chatService.chats[0].chatId,
                ],
                {relativeTo: this.route},
            );
        } else {
            throw Error("not implemented");
        }
    };

    headerElements = [
        {
            icon: "../../assets/voice-assistant-svgs/chat/chat_add.svg",
            label: "ADD",
            clickCallback: this.openAddModal,
        },
        {
            icon: "../../assets/voice-assistant-svgs/chat/chat_delete.svg",
            label: "DELETE",
            clickCallback: this.deleteChat,
        },
        {
            icon: "../../assets/voice-assistant-svgs/chat/chat_edit.svg",
            label: "EDIT",
            clickCallback: this.openEditModal,
        },
    ];
}
