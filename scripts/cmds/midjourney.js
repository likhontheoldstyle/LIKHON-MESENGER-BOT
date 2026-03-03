const axios = require("axios");
async function noobCore() {
  const x = await axios.get( "https://raw.githubusercontent.com/noobcore404/NC-STORE/refs/heads/main/NCApiUrl.json",
    { timeout: 10000 }
  );
  if (!x.data.mj) {
    throw new Error("MJ API URL not found");
  }
  return x.data.mj;
}
module.exports = {
  config: {
    name: "midjourney",
    aliases: ["mj"],
    version: "1.0.2",
    premium: true,
    author: "LIKHON AHMED",
    role: 0,
    usePrefix: true,
    description: "Generate AI images from prompt with reactions",
    guide: "{p}imagine <prompt>",
    category: "ai",
    cooldowns: 5
  },
  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply(
        "❌ Please provide a prompt\nExample: midjourney Naruto Uzumaki"
      );
    }
    try {
      api.setMessageReaction("⌛", event.messageID, event.threadID, (err) => {}, true);
      const API_BASE = await noobCore();
      const res = await axios.get(
        `${API_BASE}/imagine?prompt=${encodeURIComponent(prompt)}`,
        { timeout: 600000 }
      );
      if (!res.data || !res.data.success) {
        api.setMessageReaction("❌", event.messageID, event.threadID, (err) => {}, true);
        return message.reply("❌ Failed to generate image");
      }

      const { taskId, murl, urls } = res.data;
      if (!Array.isArray(urls) || urls.length < 4) {
        return message.reply("❌ Invalid image response");
      }
      if (!global.noobCore) global.noobCore = {};
      if (!global.noobCore.ncReply) global.noobCore.ncReply = new Map();
      return message.reply(
        {
          body: `🎨 AI Image Generated\n\n🆔 Task ID: ${taskId}\n\nReply with:\nU1 / U2 / U3 / U4`,
          attachment: await global.utils.getStreamFromURL(murl)
        },
        (err, info) => {
          if (err) return;
          api.setMessageReaction("✅", event.messageID, event.threadID, (err) => {}, true);
          global.noobCore.ncReply.set(info.messageID, {
            commandName: this.config.name,
            author: event.senderID,
            urls
          });
          setTimeout(() => {
            global.noobCore.ncReply.delete(info.messageID);
          }, 5 * 60 * 1000);
        }
      );
    } catch (err) {
      console.error("Imagine Error:", err.message);
      api.setMessageReaction("❌", event.messageID, event.threadID, (err) => {}, true);
      return message.reply("❌ API Error occurred");
    }
  },
  onReply: async function ({ event, message, api }) {
    const replyMsgID = event.messageReply?.messageID;
    if (!replyMsgID) return;
    const replyData = global.noobCore?.ncReply?.get(replyMsgID);
    if (!replyData) return;
    if (replyData.author !== event.senderID) return;
    const text = event.body.trim().toLowerCase();
    const map = { u1: 0, u2: 1, u3: 2, u4: 3 };
    if (!(text in map)) return;
    try {
      api.setMessageReaction("⌛", event.messageID, event.threadID, (err) => {}, true);      
      const index = map[text];
      const img = replyData.urls[index];
      if (!img || !img.url) {
        api.setMessageReaction("❌", event.messageID, event.threadID, (err) => {}, true);
        return message.reply("❌ Image not found");
      }
      return message.reply({
        body: `🖼 Image ${text.toUpperCase()}`,
        attachment: await global.utils.getStreamFromURL(img.url)
      }, () => {
        api.setMessageReaction("✅", event.messageID, event.threadID, (err) => {}, true);
      });
    } catch (e) {
      api.setMessageReaction("❌", event.messageID, event.threadID, (err) => {}, true);
    }
  }
};
