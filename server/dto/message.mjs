import GenertateId from "../util/generateId.mjs";
export class Message {
    constructor(messageId, timestamp, isUser, content, chatId) {
        this.messageId = messageId;
        this.timestamp = timestamp;
        this.isUser = isUser;
        this.content = content;
        this.chatId = chatId;
    }

    static getMessage(message) {
        return {
            messageId: message.messageId,
            timestamp: message.timestamp,
            isUser: message.isUser,
            content: message.content,
        };
    }

    static newMessage(timestamp, isUser, content, chatId) {
        return new Message(
            GenertateId.genertateId(),
            timestamp,
            isUser,
            content,
            chatId,
        );
    }
}
export default Message;
