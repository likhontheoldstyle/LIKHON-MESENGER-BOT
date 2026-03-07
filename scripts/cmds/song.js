const fs = require("fs");
const path = require("path");
const axios = require("axios");
const nayan = require("nayan-media-downloaders");
const Youtube = require("youtube-search-api");

module.exports = {
  config: {
    name: "song",
    aliases: ["a", "audio", "music"],
    version: "3.1",
    role: 0,
    author: "LIKHON AHMED",
    category: "media",
    guide: "{pn} [song name]",
    countDown: 5,
    shortDescription: "Search and download songs",
    longDescription: "Search songs from YouTube and download as audio"
  },

  onStart: async function ({ api, event, args, message }) {
    const keyword = args.join(" ");
    
    if (!keyword) {
      return message.reply("╭──────────────╮\n│  ❌ ERROR      │\n╰──────────────╯\n\nPlease provide a song name.\n\nExample: /song Believer");
    }

    const searchingMsg = await message.reply("╭──────────────╮\n│  🔍 SEARCHING  │\n╰──────────────╯\n\n" + `Searching for: ${keyword}`);

    try {
      const results = await Youtube.GetListByKeyword(keyword, false, 10);
      const list = results.items;

      if (!list.length) {
        await message.unsend(searchingMsg.messageID);
        return message.reply("╭──────────────╮\n│  ❌ NOT FOUND  │\n╰──────────────╯\n\nNo results found for: " + keyword);
      }

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const attachments = [];
      let msgTxt = "╭─────────────────────╮\n";
      msgTxt += "│     🎵 SONG SEARCH     │\n";
      msgTxt += "╰─────────────────────╯\n\n";
      msgTxt += `📌 *Keyword:* ${keyword}\n`;
      msgTxt += `📊 *Results:* ${list.length} songs found\n\n`;
      msgTxt += "━━━━━━━━━━━━━━━━━━━\n\n";
      
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const title = item.title.length > 35 ? item.title.substring(0, 32) + "..." : item.title;
        const duration = item.length?.simpleText || "Unknown";
        const views = item.viewCount?.text || "Unknown";
        const thumbnail = item.thumbnail?.thumbnails?.pop()?.url;
        
        msgTxt += `┃ ${i + 1}. ${title}\n`;
        msgTxt += `┃ ⏱️ ${duration}  👁️ ${views}\n`;
        msgTxt += "┃━━━━━━━━━━━━━━━━━━━\n\n";

        if (thumbnail) {
          try {
            const thumbPath = path.join(cacheDir, `thumb_${i}_${Date.now()}.jpg`);
            const thumbRes = await axios({
              method: 'GET',
              url: thumbnail,
              responseType: 'stream'
            });
            
            const thumbWriter = fs.createWriteStream(thumbPath);
            thumbRes.data.pipe(thumbWriter);
            
            await new Promise((resolve, reject) => {
              thumbWriter.on('finish', resolve);
              thumbWriter.on('error', reject);
            });
            
            attachments.push(fs.createReadStream(thumbPath));
          } catch (err) {
            console.log("Thumbnail download error:", err.message);
          }
        }
      }

      msgTxt += "╭─────────────────────╮\n";
      msgTxt += "│  💡 HOW TO USE       │\n";
      msgTxt += "├─────────────────────┤\n";
      msgTxt += "│  Reply with number   │\n";
      msgTxt += `│  (1-${list.length}) to download │\n`;
      msgTxt += "╰─────────────────────╯";

      await message.unsend(searchingMsg.messageID);

      const sent = await message.reply({
        body: msgTxt,
        attachment: attachments
      });

      setTimeout(() => {
        fs.readdir(cacheDir, (err, files) => {
          if (err) return;
          files.forEach(file => {
            if (file.startsWith('thumb_')) {
              fs.unlink(path.join(cacheDir, file), () => {});
            }
          });
        });
      }, 5000);

      if (!global.GoatBot.onReply) global.GoatBot.onReply = new Map();
      
      global.GoatBot.onReply.set(sent.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        messageID: sent.messageID,
        originalMsgID: event.messageID,
        links: list.map(v => v.id),
        titles: list.map(v => v.title)
      });

    } catch (error) {
      console.error("Search error:", error);
      await message.unsend(searchingMsg.messageID);
      return message.reply("╭──────────────╮\n│  ❌ ERROR      │\n╰──────────────╯\n\n" + error.message);
    }
  },

  onReply: async function ({ api, event, message, Reply }) {
    const { author, links, titles, messageID, originalMsgID } = Reply;
    
    if (event.senderID !== author) {
      return message.reply("╭──────────────╮\n│  ❌ ACCESS DENIED  │\n╰──────────────╯\n\nThis search is not for you!");
    }

    const choice = parseInt(event.body);
    
    if (isNaN(choice) || choice < 1 || choice > links.length) {
      return message.reply(`╭──────────────╮\n│  ❌ INVALID      │\n╰──────────────╯\n\nPlease reply with a number between 1 and ${links.length}`);
    }

    await message.unsend(messageID);

    const videoId = links[choice - 1];
    const videoTitle = titles[choice - 1];
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const waitMsg = await message.reply("╭──────────────╮\n│  ⏳ PROCESSING  │\n╰──────────────╯\n\n" + `Downloading: ${videoTitle.substring(0, 30)}...`);

    try {
      const data = await nayan.ytdown(videoUrl);
      
      if (!data || !data.data || !data.data.audio) {
        throw new Error("Could not fetch audio URL");
      }
      
      const audioUrl = data.data.audio;
      const title = data.data.title || videoTitle;

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const filePath = path.join(cacheDir, `song_${Date.now()}.mp3`);

      const response = await axios({
        method: 'GET',
        url: audioUrl,
        responseType: 'stream',
        timeout: 60000
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      await message.unsend(waitMsg.messageID);

      let successMsg = "╭──────────────╮\n";
      successMsg += "│  ✅ SUCCESS    │\n";
      successMsg += "╰──────────────╯\n\n";
      successMsg += `🎧 *${title}*\n\n`;
      successMsg += "Enjoy your song! 🎵";

      await message.reply({
        body: successMsg,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (error) {
      console.error("Download error:", error);
      await message.unsend(waitMsg.messageID);
      return message.reply("╭──────────────╮\n│  ❌ FAILED     │\n╰──────────────╯\n\n" + error.message);
    }
  }
};
