const axios = require("axios");

module.exports = {
  config: {
    name: "bot",
    version: "3.4",
    author: "LIKHON AHMED",
    countDown: 5,
    role: 0,
    description: "chat with bot using API + random replies + mention",
    category: "chat",
    guide: {
      en: "{p}bot <message>"
    }
  },

  onStart: async ({ api, event, args, usersData }) => {
    const data = await usersData.get(event.senderID);
    const name = data?.name || "Friend";

    const userMsg = args.join(" ");
    if (!userMsg) {
      return api.sendMessage("Example: /bot hi", event.threadID);
    }

    try {
      let apiUrl;
      try {
        const apiData = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
        apiUrl = apiData.data.sim;
      } catch (jsonError) {
        apiUrl = "http://65.109.80.126:20392";
      }

      const response = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(userMsg)}`);
      const replyText = response.data.data.msg;

      const msg = await api.sendMessage({
        body: `╭────────────❍\n╰➤ 👤 𝐃𝐞𝐚𝐫『 ${name} 』,\n╰➤ 🗣 ${replyText}\n╰─────────────────➤`,
        mentions: [{ tag: name, id: event.senderID }]
      }, event.threadID);

      return msg;
    } catch (err) {
      return api.sendMessage("⚠ API error: " + err.message, event.threadID);
    }
  },

  onChat: async ({ api, event, usersData }) => {
    const text = event.body?.trim();
    if (!text) return;
    if (event.senderID === api.getCurrentUserID()) return;
    if (text.startsWith("/")) return;

    const firstWord = text.split(" ")[0];
    const callWords = ["bot", "Bot", "বট"];
    
    if (callWords.includes(firstWord)) {
      const data = await usersData.get(event.senderID);
      const name = data?.name || "Friend";

      const randomMessages = [
        "এতো বট বট করলে লিভ নিবো কিন্তু 😒",
        "সাদা সাদা কালা কালা আমি মানুষ অনেক ভালা 😁",
        "হুম জান বলো শুনছি...😗",
        "আমাকে না ডেকে লিখন বস রে একটা গোফ দে",
        "আহ শোনা আমার আমাকে এতো ডাক্তাছো কেনো আসো বুকে আশো🥱",
        "তোর সাহস ক্যামনে হইলো আমাকে বট বলে ডাকোস 😤",
        "তুই নিজে বট 😒🔪",
        "না চিল্লাইয়া এবার কো শুনছি ",
        "দুই মিনিট সাইডে আসিস তো কথা আছে 😾🔪",
        "দুই টাকা দিয়ে মিস কল দিতে গিয়ে এখন দেখি দশ টাকা খরচ হয়ে গেছে 😟",
        "আর যাবো না বেগুন তুলিতে 🤭",
        "আমি আপনাকে কিভাবে সাহায্য করতে পারি...? 🤔",
        "আদেশ করুন বস...🙂",
        "হুম শুনছি আমি আপনি বলুন 😐",
        "আমার সব কমান্ড দেখতে /help টাইপ করুন ✅",
        "আসসালামু'আলাকুম জি বলুন কি করতে পারি আপনার জন্য 😊",
        "আদেশ করুন যাহাপানা 😎",
        "আবার যদি আমারে বট কইয়া ডাক দেছ তাইলে তোর বিয়ে হবে না 🫤😏",
        "তোগো বাড়ির জামাই আমি সম্মান দে 😼",
        "তুই বট তোর নানি বট 😤 তোর কত বড় সাহস তুই আমারে বট কস 😤",
        "আপনার কি চরিত্রে সমস্যা যে এতো বার আমাকে ডাকতেছেন 🤨",
        "ডাকছোত কেন ফাস্ট কো 😒",
        "তুমি কি আমাকে ডেকেছো...? 😇"
      ];

      const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
      
      const msg = await api.sendMessage({
        body: `╭────────────❍\n╰➤ 👤 𝐃𝐞𝐚𝐫『 ${name} 』,\n╰➤ 🗣 ${randomMessage}\n╰─────────────────➤`,
        mentions: [{ tag: name, id: event.senderID }]
      }, event.threadID);

      return msg;
    }

    const isReplyToBot = event.type === "message_reply" && 
                         event.messageReply && 
                         event.messageReply.senderID === api.getCurrentUserID() &&
                         event.senderID !== api.getCurrentUserID();

    if (isReplyToBot) {
      try {
        const data = await usersData.get(event.senderID);
        const name = data?.name || "Friend";

        let apiUrl;
        try {
          const apiData = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
          apiUrl = apiData.data.sim;
        } catch (jsonError) {
          apiUrl = "http://65.109.80.126:20392";
        }

        const response = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(text)}`);
        const replyText = response.data.data.msg;

        const msg = await api.sendMessage({
          body: `╭────────────❍\n╰➤ 👤 𝐃𝐞𝐚𝐫『 ${name} 』,\n╰➤ 🗣 ${replyText}\n╰─────────────────➤`,
          mentions: [{ tag: name, id: event.senderID }]
        }, event.threadID, event.messageReply.messageID);

        return msg;
      } catch (err) {
        return api.sendMessage("⚠ API error: " + err.message, event.threadID);
      }
    }
  }
};
