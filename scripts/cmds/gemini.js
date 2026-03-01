const axios = require("axios");

module.exports = {
  config: {
    name: "gemini",
    version: "1.4",
    author: "LIKHON AHMED",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Chat with Google Gemini AI"
    },
    description: {
      en: "Chat with Google Gemini AI using Vercel API"
    },
    category: "ai",
    guide: {
      en: "use /gemini [question] or reply to bot's message"
    }
  },

  langs: {
    en: {
      error: "❌ Error: %1",
      noPrompt: "⚠ Please provide a question. Example: /gemini hi",
      reply: "💬 Reply to my message to ask more!"
    }
  },

  onStart: async ({ api, event, args, getLang }) => {
    const question = args.join(" ").trim();
    
    if (!question) {
      return api.sendMessage(getLang("noPrompt"), event.threadID);
    }

    api.setMessageReaction("⏳", event.messageID, (err) => {
      if (err) console.error("Reaction error:", err);
    }, true);

    try {
      const response = await axios.get(`https://gemini-api-iota-seven.vercel.app/api/ask?prompt=${encodeURIComponent(question)}`);
      
      if (response.data.success) {
        const answer = response.data.response;

        const msg = await api.sendMessage({
          body: answer,
          mentions: [{ tag: event.senderID, id: event.senderID }]
        }, event.threadID);

        api.setMessageReaction("✅", event.messageID, (err) => {
          if (err) console.error("Reaction error:", err);
        }, true);

        global.GoatBot.onReply.set(msg.messageID, {
          commandName: module.exports.config.name,
          author: event.senderID,
          messageID: msg.messageID,
          originalMessageID: event.messageID
        });

      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {
        if (err) console.error("Reaction error:", err);
      }, true);
      api.sendMessage(getLang("error", error.message), event.threadID);
    }
  },

  onReply: async ({ api, event, args, getLang, Reply }) => {
    const question = args.join(" ").trim();
    
    if (!question) {
      return api.sendMessage(getLang("reply"), event.threadID);
    }

    if (event.senderID === api.getCurrentUserID()) return;

    const replyCommandName = global.GoatBot.onReply.get(event.messageReply?.messageID)?.commandName;
    
    if (replyCommandName !== module.exports.config.name) {
      return;
    }

    const replyData = global.GoatBot.onReply.get(event.messageReply?.messageID);
    
    if (replyData && replyData.originalMessageID && replyData.originalMessageID === event.messageID) {
      return;
    }

    api.setMessageReaction("⏳", event.messageID, (err) => {
      if (err) console.error("Reaction error:", err);
    }, true);

    try {
      const response = await axios.get(`https://gemini-api-iota-seven.vercel.app/api/ask?prompt=${encodeURIComponent(question)}`);
      
      if (response.data.success) {
        const answer = response.data.response;

        const msg = await api.sendMessage({
          body: answer,
          mentions: [{ tag: event.senderID, id: event.senderID }]
        }, event.threadID, event.messageReply?.messageID);

        api.setMessageReaction("✅", event.messageID, (err) => {
          if (err) console.error("Reaction error:", err);
        }, true);

        global.GoatBot.onReply.set(msg.messageID, {
          commandName: module.exports.config.name,
          author: event.senderID,
          messageID: msg.messageID,
          originalMessageID: event.messageID
        });

      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error("Gemini Reply Error:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {
        if (err) console.error("Reaction error:", err);
      }, true);
      api.sendMessage(getLang("error", error.message), event.threadID);
    }
  }
};
