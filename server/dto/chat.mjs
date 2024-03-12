import GenertateId from "../util/generateId.mjs";
export class Chat {
    constructor(chatId, topic, personalityId) {
        this.chatId = chatId;
        this.topic = topic;
        this.personalityId = personalityId;
    }

    static getChat(camera) {
        return new Chat(camera.chatId, camera.topic, camera.personalityId);
    }

    static newChat(topic, personalityId) {
        return new Chat(GenertateId.genertateId(), topic, personalityId);
    }
}
export default Chat;
