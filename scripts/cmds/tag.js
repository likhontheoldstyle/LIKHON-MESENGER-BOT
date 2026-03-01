module.exports = {
  config: {
    name: "tag",
    version: "2.1",
    author: "LIKHON AHMED",
    countDown: 0,
    role: 0,
    description: "Tag a user",
    category: "social",
    guide: { 
      en: "{p}{n} [reply/mention/uid] <text>\nExample: {p}{n} 1000123456789 Hello" 
    }
  },

  onStart: async function({ api, event, args }) {
    try {
      let targetId;
      let messageText = "";

      const input = args.join(" ").trim();
      const uidRegex = /^\d+$/;

      if (event.messageReply) {
        targetId = event.messageReply.senderID;
        messageText = input;
      } 
      else if (args[0] && uidRegex.test(args[0])) {
        targetId = args[0];
        messageText = args.slice(1).join(" ");
      } 
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetId = Object.keys(event.mentions)[0];
        const mentionedName = event.mentions[targetId].replace("@", "");
        messageText = input.replace(`@${mentionedName}`, "").trim();
      } 
      else {
        targetId = event.senderID;
        messageText = input;
      }

      if (!targetId) {
        return api.sendMessage("⚠ Reply, mention someone, or provide a UID to tag.", event.threadID, event.messageID);
      }

      const userInfo = await api.getUserInfo(targetId);
      
      if (!userInfo || !userInfo[targetId]) {
        return api.sendMessage("❌ Could not fetch user information. Make sure the UID is valid.", event.threadID, event.messageID);
      }

      const targetName = userInfo[targetId].name;

      api.sendMessage({
        body: `${targetName} ${messageText}`,
        mentions: [{ tag: targetName, id: targetId }]
      }, event.threadID, event.messageID);

    } catch (error) {
      api.sendMessage("❌ Error: " + error.message, event.threadID, event.messageID);
    }
  }
};
