module.exports = {
    config: {
        name: "ai",
        version: "1.1",
        author: "LIKHON AHMED",
        countDown: 3,
        role: 0,
        shortDescription: {
            vi: "Trò chuyện với AI",
            en: "Chat with AI"
        },
        description: {
            vi: "Trò chuyện với AI thông qua API Nayan",
            en: "Chat with AI using Nayan API"
        },
        category: "ai",
        guide: {
            vi: "dùng /ai [câu hỏi] hoặc reply tin nhắn của bot",
            en: "use /ai [question] or reply to bot's message"
        }
    },

    langs: {
        vi: {
            thinking: "🤔 Đang suy nghĩ...",
            error: "❌ Đã xảy ra lỗi, vui lòng thử lại sau",
            reply: "💬 Trả lời tin nhắn của tôi để hỏi tiếp nhé!"
        },
        en: {
            thinking: "🤔 Thinking...",
            error: "❌ An error occurred, please try again later",
            reply: "💬 Reply to my message to ask more!"
        }
    },

    onStart: async function ({ api, args, message, event, getLang }) {
        const question = args.join(" ");
        
        if (!question) {
            return message.reply(getLang("reply"));
        }

        await handleAIResponse(message, question, getLang, event);
    },

    onReply: async function ({ api, args, message, event, getLang, Reply }) {
        const question = args.join(" ");
        
        if (!question) {
            return message.reply(getLang("reply"));
        }

        const replyMessageID = event.messageReply.messageID;
        await handleAIResponse(message, question, getLang, event, replyMessageID);
    }
};

async function handleAIResponse(message, question, getLang, event, replyToMessageID = null) {
    try {
        const encodedQuestion = encodeURIComponent(question);
        const response = await fetch(`https://nayan-ai-online.vercel.app/nayan/pai?number=0&question=${encodedQuestion}`);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.answer) {
            const answer = data.answer;
            
            await message.reply({
                body: answer,
                mentions: [{
                    tag: event.senderID,
                    id: event.senderID
                }]
            }, (err, info) => {
                if (err) return console.error(err);
                
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: module.exports.config.name,
                    author: event.senderID,
                    messageID: info.messageID
                });
            });
        } else {
            throw new Error("No answer in response");
        }

    } catch (error) {
        console.error("AI Command Error:", error);
        message.reply(getLang("error"));
    }
}
