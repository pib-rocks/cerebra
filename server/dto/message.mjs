export class message{
    constructor(messageId, timestamp, isUser, content, chatId){
        this.messageId = messageId;
        this.timestamp = timestamp;
        this.isUser = isUser;
        this.content = content;
        this.chatId = chatId;
    }

    static getMessage(messageId, timestamp, isUser, content){
        return {"messageId" : messageId, "timestamp" : timestamp, "isUser" : isUser, "content" : content}
    }

    static newMessage(timestamp, isUser, content, chatId){
        return new message(Math.floor(Math.random() * (1000 - 10 + 1) + 10), timestamp, isUser, content, chatId)
    }
}
export default message