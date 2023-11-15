import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {Router, ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BehaviorSubject, Observable} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {MockElement} from "src/app/voice-assistant/voice-assistant-chat/mock-element.class";

@Component({
    selector: "app-voice-assistant-chat",
    templateUrl: "./voice-assistant-chat.component.html",
    styleUrls: ["./voice-assistant-chat.component.css"],
})
export class VoiceAssistantChatComponent implements OnInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    personalityIcon: string = "../../assets/voice-assistant-svgs/chat/chat.svg";

    nameFormControl: FormControl = new FormControl("");
    subject!: Observable<SidebarElement[]>;

    constructor(
        private modalService: NgbModal,
        private voiceAssistantService: VoiceAssistantService,
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    // FIXME: mockObjects for allowing basic functionality, delete after implementing chatService and Chat
    mockElements: MockElement[] = [
        new MockElement("Nürnberg", "12345678-9abc-def0-1234-56789abc"),
        new MockElement(
            "Humanoide Roboter",
            "22345678-9abc-def0-1234-56789abc",
        ),
        new MockElement(
            "Mockige Mockelemente",
            "32345678-9abc-def0-1234-56789abc",
        ),
    ];
    mockSubject: BehaviorSubject<SidebarElement[]> = new BehaviorSubject<
        SidebarElement[]
    >(this.mockElements);
    //

    ngOnInit() {
        localStorage.setItem("voice-assistant-tab", "chat");
        //FIXME: Implement chatService
        // this.subject = this.chatService.getSubject();
        this.subject = this.mockSubject;
        this.nameFormControl.setValidators([
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(255),
        ]);
    }

    showModal = (uuid?: string) => {
        return this.modalService
            .open(this.modalContent, {
                ariaLabelledBy: "modal-basic-title",
                size: "sm",
                windowClass: "myCustomModalClass",
                backdropClass: "myCustomBackdropClass",
            })
            .result.then(
                (result) => {
                    console.log(`Closed with: ${result}`);
                },
                () => {
                    if (uuid) {
                        this.editChat(uuid);
                    } else {
                        this.addChat();
                    }
                },
            );
    };

    openAddModal = () => {
        this.nameFormControl.setValue("");
        this.showModal();
    };

    openEditModal = () => {
        const uuid: string = this.router.parseUrl(this.router.url).root
            .children["primary"].segments[2].path;
        if (uuid) {
            // FIXME: implement chatService
            // const updateChat =
            //     this.chatService.getPersonality(uuid);
            // this.nameFormControl.setValue(updateChat?.name ?? "");
            this.showModal(uuid);
        }
    };

    addChat() {
        if (this.nameFormControl.valid) {
            // FIXME: implement chatService, implement Chat
            // this.chatService.createChat(
            //     new Chat(
            //         "",
            //         this.nameFormControl.value,
            //     ),
            // );
        }
        throw Error("not implemented");
    }

    editChat = (uuid: string) => {
        // FIXME: implement chatService, implement Chat
        // const updatePersonality = this.chatService
        //     .getChat(uuid)
        //     ?.clone();
        // if (updatePersonality) {
        //     updatePersonality.name = this.nameFormControl.value;
        //     this.chatService.updateChatById(updatePersonality);
        // }
        throw Error("not implemented");
    };

    deleteChat = () => {
        // FIXME: implement chatService, implement Chat
        // this.chatService.deleteChatById(
        //     this.router.parseUrl(this.router.url).root.children["primary"]
        //         .segments[2].path,
        // );
        // this.router.navigate(
        //     [this.chatService.chats[0].personalityId],
        //     {relativeTo: this.route},
        // );
        throw Error("not implemented");
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
