import {SidebarElement} from "../interfaces/sidebar-element.interface";

export class Chat implements SidebarElement {
    constructor(
        public topic: string,
        public personalityId: string,
        public chatId: string,
    ) {}

    getName(): string {
        return this.topic;
    }
    getUUID(): string {
        return this.chatId;
    }
    clone(): Chat {
        console.log({...this});
        return {...this};
    }
}

export class ChatDto {
    constructor(
        public topic: string,
        public personalityId: string,
    ) {}
    static parseChatToDto(chat: Chat): ChatDto {
        return new ChatDto(chat.topic, chat.personalityId);
    }
}
