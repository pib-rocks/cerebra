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

    static fromDto(dto: {
        topic: string;
        personalityId: string;
        chatId: string;
    }): Chat {
        return new Chat(dto.topic, dto.personalityId, dto.chatId);
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
