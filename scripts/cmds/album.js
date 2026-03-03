const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "album",
    version: "2.1",
    role: 0,
    author: "LIKHON AHMED",
    category: "media",
    guide: {
      en: "{p}{n} - Show album list\n{p}{n} [category] - Get video from category\nExample: {p}{n} funny",
    },
    countDown: 5,
    shortDescription: {
      en: "Get videos from different categories"
    },
    longDescription: {
      en: "Watch videos from various categories like funny, islamic, sad, anime etc."
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const ALBUM_JSON_URL = "https://raw.githubusercontent.com/likhontheoldstyle/LIKHON-FMS-VIDEO-JSON/refs/heads/main/album/album.json";

    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {
        if (err) console.error("Reaction error:", err);
      }, true);

      let albumData;
      try {
        const response = await axios.get(ALBUM_JSON_URL, { timeout: 10000 });
        albumData = response.data;
      } catch (error) {
        console.error("Failed to fetch album data:", error);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("❌ Failed to load video album. Please try again later.");
      }

      const categoryEmojis = {
        funny: "😂",
        islamic: "🕌",
        sad: "😢",
        anime: "👾",
        baby: "👶",
        lofi: "🎧",
        horny: "🔞",
        couple: "💑",
        flower: "🌸",
        aesthetic: "✨",
        sigma: "👑",
        lyrics: "🎵",
        cat: "🐱",
        "18+": "🔞",
        freefire: "🔥",
        football: "⚽",
        girl: "💃",
        friends: "👥"
      };

      if (!args[0]) {
        const categories = Object.keys(albumData).filter(cat => 
          albumData[cat] && albumData[cat].length > 0
        );
        
        const categoryList = categories.map((cat, index) => {
          const emoji = categoryEmojis[cat] || "📹";
          const name = cat.charAt(0).toUpperCase() + cat.slice(1);
          return ` ${index + 1}. ${emoji} 𝐀𝐥𝐛𝐮𝐦 𝐍𝐚𝐦𝐞: ${name} ─ 🎬 ${albumData[cat].length} 𝐯𝐢𝐝𝐞𝐨𝐬`;
        }).join("\n");

        const totalVideos = categories.reduce((sum, cat) => sum + albumData[cat].length, 0);

        const msg = 
"╭────────────────────────────────────╮\n" +
"│        📀 𝐕𝐈𝐃𝐄𝐎 𝐀𝐋𝐁𝐔𝐌 📀          │\n" +
"├────────────────────────────────────┤\n" +
`│  🎥 𝐓𝐨𝐭𝐚𝐥 𝐕𝐢𝐝𝐞𝐨𝐬: ${totalVideos} 𝐯𝐢𝐝𝐞𝐨𝐬      │\n` +
"╰────────────────────────────────────╯\n\n" +
categoryList +
"\n\n┌────────────────────────────────────┐\n" +
"│           💡 𝐇𝐨𝐰 𝐓𝐨 𝐔𝐬𝐞            │\n" +
"├────────────────────────────────────┤\n" +
"│  🎯 𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 𝐧𝐮𝐦𝐛𝐞𝐫 𝐭𝐨 𝐩𝐥𝐚𝐲    │\n" +
"│  📝 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: /𝐚𝐥𝐛𝐮𝐦 𝐟𝐮𝐧𝐧𝐲         │\n" +
"│  🔍 𝐓𝐲𝐩𝐞 𝐜𝐚𝐭𝐞𝐠𝐨𝐫𝐲 𝐧𝐚𝐦𝐞 𝐝𝐢𝐫𝐞𝐜𝐭𝐥𝐲    │\n" +
"└────────────────────────────────────┘";

        const info = await message.reply(msg);
        
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          messageID: info.messageID,
          categories: categories
        });
        
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        return;
      }

      const categoryArg = args[0].toLowerCase();
      const matchedCategory = Object.keys(albumData).find(cat => 
        cat.toLowerCase() === categoryArg || 
        cat.toLowerCase().includes(categoryArg)
      );

      if (!matchedCategory) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply(`❌ Category '${args[0]}' not found. Use /album to see all categories.`);
      }

      await sendVideoFromCategory(api, event, message, albumData, matchedCategory, categoryEmojis);

    } catch (error) {
      console.error("Album command error:", error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ An error occurred: " + error.message);
    }
  },

  onReply: async function ({ api, event, message, Reply }) {
    const { author, categories } = Reply;
    
    if (event.senderID !== author) return;
    
    const ALBUM_JSON_URL = "https://raw.githubusercontent.com/likhontheoldstyle/LIKHON-FMS-VIDEO-JSON/refs/heads/main/album/album.json";

    try {
      const choice = parseInt(event.body);
      
      if (isNaN(choice) || choice < 1 || choice > categories.length) {
        return message.reply("❌ Invalid number. Please reply with a valid number from the list.");
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const response = await axios.get(ALBUM_JSON_URL, { timeout: 10000 });
      const albumData = response.data;
      
      const selectedCategory = categories[choice - 1];
      
      const categoryEmojis = {
        funny: "😂",
        islamic: "🕌",
        sad: "😢",
        anime: "👾",
        baby: "👶",
        lofi: "🎧",
        horny: "🔞",
        couple: "💑",
        flower: "🌸",
        aesthetic: "✨",
        sigma: "👑",
        lyrics: "🎵",
        cat: "🐱",
        "18+": "🔞",
        freefire: "🔥",
        football: "⚽",
        girl: "💃",
        friends: "👥"
      };
      
      await sendVideoFromCategory(api, event, message, albumData, selectedCategory, categoryEmojis);

    } catch (error) {
      console.error("Reply error:", error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ Failed to fetch video. Please try again.");
    }
  }
};

async function sendVideoFromCategory(api, event, message, albumData, category, categoryEmojis) {
  const videos = albumData[category];
  
  if (!videos || videos.length === 0) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply(`❌ No videos found in category: ${category}`);
  }

  const validVideos = videos.filter(v => v && v.trim() !== "");
  if (validVideos.length === 0) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply(`❌ No valid videos in category: ${category}`);
  }

  const randomVideo = validVideos[Math.floor(Math.random() * validVideos.length)];
  const videoPath = path.join(__dirname, "cache", `album_${category}_${Date.now()}.mp4`);
  
  try {
    await fs.ensureDir(path.join(__dirname, "cache"));

    const downloadMsg = await message.reply(`⏬ 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐢𝐧𝐠 ${category} 𝐯𝐢𝐝𝐞𝐨...`);

    const response = await axios({
      method: 'GET',
      url: randomVideo,
      responseType: 'stream',
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024
    });

    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    await message.unsend(downloadMsg.messageID);

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    const emoji = categoryEmojis[category] || "🎬";
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    await message.reply({
      body: `╭────────────────────────────────────╮\n` +
            `│        ${emoji} 𝐍𝐎𝐖 𝐏𝐋𝐀𝐘𝐈𝐍𝐆 ${emoji}         │\n` +
            `├────────────────────────────────────┤\n` +
            `│  📌 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲: ${categoryName}             │\n` +
            `│  🎥 𝐓𝐨𝐭𝐚𝐥: ${albumData[category].length} 𝐯𝐢𝐝𝐞𝐨𝐬        │\n` +
            `│  🎲 𝐑𝐚𝐧𝐝𝐨𝐦 𝐬𝐞𝐥𝐞𝐜𝐭𝐞𝐝               │\n` +
            `╰────────────────────────────────────╯\n\n` +
            `𝐄𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐯𝐢𝐝𝐞𝐨! 🎥`,
      attachment: fs.createReadStream(videoPath)
    });

    fs.unlinkSync(videoPath);

  } catch (downloadError) {
    console.error("Download error:", downloadError);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    await message.reply(`❌ Failed to download ${category} video. The file may be too large or the link is broken.`);
    
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
  }
}
