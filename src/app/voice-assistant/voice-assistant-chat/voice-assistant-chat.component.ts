import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {Observable} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {ChatService} from "src/app/shared/services/chat.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {CerebraRegex} from "src/app/shared/types/cerebra-regex";
import {ChatDto} from "src/app/shared/types/chat.class";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";

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
    personality?: VoiceAssistant;
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
        this.personalityId = this.router.url
            .split("/")
            .find((segment) => RegExp(CerebraRegex.UUID).test(segment));
        this.personality = this.personalityId
            ? this.voiceAssistantService.getPersonality(this.personalityId) ??
              this.route.snapshot.params["personality"]
            : this.route.snapshot.params["personality"];
        if (this.personality) {
            this.subject = this.chatService.getSubject(
                this.personality.personalityId,
            );
        } else {
            throw Error("undefined personality and subject");
        }
        localStorage.setItem("voice-assistant-tab", "chat");
        this.topicFormControl.setValidators([
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(255),
        ]);
    }

    showModal = () => {
        this.ngbModalRef = this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            windowClass: "myCustomModalClass",
            backdropClass: "myCustomBackdropClass",
        });
        return this.ngbModalRef;
    };

    openAddModal = () => {
        this.topicFormControl.setValue("");
        this.showModal();
    };

    openEditModal = () => {
        this.uuid =
            this.router.url.split("/").length > 3
                ? this.router.url.split("/").pop()
                : undefined;
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
        const uuid =
            this.router.url.split("/").length > 3
                ? this.router.url.split("/").pop()
                : undefined;
        if (uuid) {
            this.chatService.deleteChatById(uuid);
            localStorage.removeItem("chat");
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
