export class Chat{
    constructor(chatId, topic, personalityId){
        this.chatId = chatId;
        this.topic = topic;
        this.personalityId = personalityId;
    }

    
    static getChat(c){
        return new Chat(c.chatId, c.topic, c.personalityId);
    }

    static newChat(topic, personalityId){
        return new Chat(Math.floor(Math.random() * (1000 - 10 + 1) + 10), topic, personalityId);
    }
}
export default Chat