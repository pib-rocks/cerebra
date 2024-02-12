export class chat{
    constructor(chatId, topic, personalityId){
        this.chatId = chatId;
        this.topic = topic;
        this.personalityId = personalityId;
    }

    
    static getChat(chatId, topic, personalityId){
        return new chat(chatId, topic, personalityId);
    }

    static newChat(topic, personalityId){
        return new chat(Math.floor(Math.random() * (1000 - 10 + 1) + 10), topic, personalityId);
    }
}
export default chat