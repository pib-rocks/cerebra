import {Injectable} from "@angular/core";
import {Chat, ChatDto} from "../types/chat.class";
import {BehaviorSubject, Observable, catchError, map, throwError} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {SidebarService} from "../interfaces/sidebar-service.interface";
import {SidebarElement} from "../interfaces/sidebar-element.interface";
import {ChatMessage} from "../types/chat-message";
import {RosService} from "./ros-service/ros.service";
import {ChatMessage as RosChatMessage} from "../ros-message-types/ChatMessage";

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
                messages.unshift({
                    messageId: rosChatMessage.message_id,
                    timestamp: rosChatMessage.timestamp,
                    isUser: rosChatMessage.is_user,
                    content: rosChatMessage.content,
                });
                subject.next(messages);
            }
        });
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

    createChat(chat: ChatDto) {
        this.apiService
            .post(UrlConstants.CHAT, chat)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response) => {
                this.addChat(
                    new Chat(
                        response["topic"],
                        response["personalityId"],
                        response["chatId"],
                    ),
                );
            });
    }

    getAllChats() {
        this.apiService
            .get(UrlConstants.CHAT)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
                map((response) => response as {voiceAssistantChats: Chat[]}),
            )
            .subscribe((response) => {
                this.chats.splice(0);
                response.voiceAssistantChats.forEach((chatDto) => {
                    this.chats.push(
                        new Chat(
                            chatDto.topic,
                            chatDto.personalityId,
                            chatDto.chatId,
                        ),
                    );
                });
                this.chatSubject.next(this.chats);
            });
    }

    updateChatById(chat: Chat) {
        this.apiService
            .put(
                UrlConstants.CHAT + `/${chat.chatId}`,
                ChatDto.parseChatToDto(chat),
            )
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response) => {
                this.editChat(
                    new Chat(
                        response["topic"],
                        response["personalityId"],
                        response["chatId"],
                    ),
                );
            });
    }

    deleteChatById(uuid: string) {
        this.apiService
            .delete(UrlConstants.CHAT + `/${uuid}`)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe(() => {
                this.deleteChat(uuid);
            });
    }

    getChatById(uuid: string) {
        this.apiService
            .get(UrlConstants.CHAT + `/${uuid}`)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response) => {
                this.addChat(
                    new Chat(
                        response["topic"],
                        response["personalityId"],
                        response["chatId"],
                    ),
                );
            });
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
}
