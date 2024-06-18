import GenertateId from "../util/generateId.mjs";
export class Chat {
    constructor(chatId, topic, personalityId) {
        this.chatId = chatId;
        this.topic = topic;
        this.personalityId = personalityId;
    }

    static getChat(chat) {
        return new Chat(chat.chatId, chat.topic, chat.personalityId);
    }

    static newChat(topic, personalityId) {
        return new Chat(GenertateId.genertateId(), topic, personalityId);
    }
}
export default Chat;
