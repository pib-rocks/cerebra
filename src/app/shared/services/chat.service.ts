import {Injectable} from "@angular/core";
import {Chat, ChatDto} from "../types/chat.class";
import {BehaviorSubject, Observable, map} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {SidebarService} from "../interfaces/sidebar-service.interface";
import {SidebarElement} from "../interfaces/sidebar-element.interface";
import {ChatMessage} from "../types/chat-message";
import {RosService} from "./ros-service/ros.service";
import {UtilService} from "./util.service";

@Injectable({
    providedIn: "root",
})
export class ChatService implements SidebarService {
    chats: Chat[] = [];
    chatSubject: BehaviorSubject<Chat[]> = new BehaviorSubject<Chat[]>([]);
    private messagesSubjectFromChatId: Map<
        string,
        BehaviorSubject<ChatMessage[]>
    > = new Map();
    private IsListeningFromChatId: Map<string, BehaviorSubject<boolean>> =
        new Map();

    constructor(
        private apiService: ApiService,
        private rosService: RosService,
    ) {
        this.getAllChats();
        this.rosService.chatMessageReceiver$.subscribe((rosChatMessage) => {
            const subject = this.messagesSubjectFromChatId.get(
                rosChatMessage.chat_id,
            );
            if (subject) {
                const messages = subject.getValue();
                messages.push({
                    messageId: rosChatMessage.message_id,
                    timestamp: rosChatMessage.timestamp,
                    isUser: rosChatMessage.is_user,
                    content: rosChatMessage.content,
                });
                subject.next(messages);
            }
        });
        this.rosService.chatIsListeningReceiver$.subscribe(
            ({chat_id, listening}) => {
                const subject = this.IsListeningFromChatId.get(chat_id);
                if (subject === undefined) {
                    this.IsListeningFromChatId.set(
                        chat_id,
                        new BehaviorSubject<boolean>(listening),
                    );
                } else {
                    subject.next(listening);
                }
            },
        );
    }

    private setChats(chats: Chat[]) {
        this.chats = chats;
        this.chatSubject.next(this.chats.slice());
    }

    getSubject(uuid: string): Observable<SidebarElement[]> {
        return this.chatSubject.pipe(
            map((value) => {
                return value.filter((m) => m.personalityId === uuid);
            }),
        );
    }

    addChat(chat: Chat) {
        if (!this.chats.find((elem) => elem.chatId === chat.chatId)) {
            this.chats.push(chat);
            this.chatSubject.next(this.chats);
        }
    }

    editChat(chat: Chat) {
        const index = this.chats.findIndex(
            (elem) => elem.chatId === chat.chatId,
        );
        if (index != -1) {
            this.chats[index] = chat;
            this.chatSubject.next(this.chats);
        }
    }

    deleteChat(uuid: string) {
        this.chats.splice(
            this.chats.findIndex((elem) => {
                return elem.chatId === uuid;
            }),
            1,
        );
        this.chatSubject.next(this.chats);
    }

    getChat(uuid: string): Chat | undefined {
        return this.chats.find((elem) => {
            return elem.chatId === uuid;
        });
    }

    createChat(chat: ChatDto): Observable<Chat> {
        return UtilService.createResultObservable(
            this.apiService.post(UrlConstants.CHAT, chat),
            (response) => {
                const chat = Chat.fromDto(response);
                this.addChat(chat);
                return chat;
            },
        );
    }

    getAllChats(): Observable<Chat[]> {
        return UtilService.createResultObservable(
            this.apiService.get(UrlConstants.CHAT),
            (response) => {
                const chats = (response["voiceAssistantChats"] as Chat[]).map(
                    (dto) => Chat.fromDto(dto),
                );
                this.setChats(chats);
                return chats;
            },
        );
    }

    updateChatById(chat: Chat): Observable<Chat> {
        return UtilService.createResultObservable(
            this.apiService.put(
                UrlConstants.CHAT + `/${chat.chatId}`,
                ChatDto.parseChatToDto(chat),
            ),
            (response) => {
                const chat = Chat.fromDto(response);
                this.editChat(chat);
                return chat;
            },
        );
    }

    deleteChatById(uuid: string): Observable<void> {
        return UtilService.createResultObservable(
            this.apiService.delete(UrlConstants.CHAT + `/${uuid}`),
            (_) => this.deleteChat(uuid),
        );
    }

    getChatById(uuid: string): Observable<Chat> {
        return UtilService.createResultObservable(
            this.apiService.get(UrlConstants.CHAT + `/${uuid}`),
            (response) => {
                const chat = Chat.fromDto(response);
                this.addChat(chat);
                return chat;
            },
        );
    }

    getMessagesByChatId(chatId: string): Observable<ChatMessage[]> {
        return this.apiService
            .get(`${UrlConstants.CHAT}/${chatId}/messages`)
            .pipe(map((response) => response["messages"]));
    }

    createChatMessage(
        chatId: string,
        content: string,
    ): Observable<ChatMessage> {
        return this.apiService.post(`${UrlConstants.CHAT}/${chatId}/messages`, {
            content,
            isUser: true,
        });
    }

    sendChatMessage(chatId: string, content: string): Observable<void> {
        return this.rosService.sendChatMessage(chatId, content);
    }

    getChatMessagesObservable(chatId: string): Observable<ChatMessage[]> {
        const observable = this.messagesSubjectFromChatId.get(chatId);
        if (observable) {
            return observable;
        } else {
            const messageSubject = new BehaviorSubject<ChatMessage[]>([]);
            this.getMessagesByChatId(chatId).subscribe((messages) =>
                messageSubject.next(messages),
            );
            this.messagesSubjectFromChatId.set(chatId, messageSubject);
            return messageSubject;
        }
    }

    getIsListeningObservable(chatId: string): Observable<boolean> {
        let subject = this.IsListeningFromChatId.get(chatId);
        if (subject === undefined) {
            subject = new BehaviorSubject<boolean>(false);
            this.IsListeningFromChatId.set(chatId, subject);
            this.rosService
                .getChatIsListening(chatId)
                .subscribe((listening) => {
                    subject!.next(listening);
                });
        }
        return subject;
    }

    filterMessageUpdates(message: ChatMessage[]) {
        return message.filter((message, index, messages) => {
            if (index + 1 >= messages.length) {
                return true;
            }
            if (message.messageId == messages[index + 1].messageId) {
                return false;
            }
            return true;
        });
    }
}
