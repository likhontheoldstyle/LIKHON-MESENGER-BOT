const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "getinfo",
    version: "2.1",
    author: "LIKHON AHMED",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Get Facebook user info"
    },
    longDescription: {
      en: "Get detailed information about a Facebook user using UID"
    },
    category: "info",
    guide: {
      en: "{pn}getinfo [UID]\nExample: {pn}getinfo 61572915213085"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const uid = args[0];
      
      if (!uid) {
        return api.sendMessage("⚠ Please provide a UID.\nExample: /getinfo 61572915213085", event.threadID);
      }

      const userInfo = await api.getUserInfo(uid);
      
      if (!userInfo || !userInfo[uid]) {
        return api.sendMessage("❌ User information not found. Make sure the UID is valid.", event.threadID);
      }

      const user = userInfo[uid];
      
      const gender = user.gender === 'male' ? "👨 Male" : user.gender === 'female' ? "👩 Female" : "⚥ Not specified";
      
      let birthday = "🎂 Not available (private)";
      if (user.birthday) {
        birthday = `🎂 ${user.birthday}`;
      } else if (user.birthday_date) {
        birthday = `🎂 ${user.birthday_date}`;
      }
      
      const followerCount = user.followerCount || 0;
      const followCount = user.followCount || 0;
      
      let location = "📍 Not available";
      if (user.location) {
        if (typeof user.location === 'object') {
          location = `📍 ${user.location.name || 'Not available'}`;
        } else {
          location = `📍 ${user.location}`;
        }
      }
      
      let hometown = "🏠 Not available";
      if (user.hometown) {
        if (typeof user.hometown === 'object') {
          hometown = `🏠 ${user.hometown.name || 'Not available'}`;
        } else {
          hometown = `🏠 ${user.hometown}`;
        }
      }
      
      const about = user.about || "📝 No bio available";
      const relationshipStatus = user.relationship_status || "💑 Not specified";
      
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      
      const infoMessage = 
        `╭━━━━━━━━━━━━━━━━━━╮\n` +
        `   🔍 USER INFORMATION   \n` +
        `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
        `👤 Name: ${user.name}\n` +
        `🔗 Profile: https://facebook.com/${uid}\n` +
        `${birthday}\n` +
        `👥 Followers: ${followerCount}\n` +
        `👣 Following: ${followCount}\n` +
        `${gender}\n` +
        `🆔 UID: ${uid}\n` +
        `${location}\n` +
        `${hometown}\n` +
        `${about.substring(0, 50)}${about.length > 50 ? '...' : ''}\n` +
        `${relationshipStatus}\n` +
        `╭━━━━━━━━━━━━━━━━━━╮\n` +
        `   📱 LIKHON AHMED    \n` +
        `╰━━━━━━━━━━━━━━━━━━╯`;

      const imagePath = __dirname + `/cache/${uid}_info.png`;
      
      const file = fs.createWriteStream(imagePath);
      const r = request(encodeURI(avatarUrl));
      
      r.on('error', err => {
        console.error("Image download error:", err);
        return api.sendMessage(infoMessage, event.threadID);
      });
      
      r.pipe(file);
      
      file.on('finish', () => {
        api.sendMessage({
          body: infoMessage,
          attachment: fs.createReadStream(imagePath)
        }, event.threadID, () => fs.unlinkSync(imagePath));
      });
      
      file.on('error', err => {
        console.error("File write error:", err);
        api.sendMessage(infoMessage, event.threadID);
      });

    } catch (err) {
      console.error("Getinfo Error:", err);
      return api.sendMessage("❌ Error: " + err.message, event.threadID);
    }
  }
};
