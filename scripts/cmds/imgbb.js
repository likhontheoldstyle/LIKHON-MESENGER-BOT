const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "imgbb",
    version: "1.2",
    role: 0,
    author: "LIKHON AHMED",
    category: "utility",
    guide: {
      en: "{p}{n} [image url] - Upload image to IMGBB\nOr reply to an image message"
    },
    countDown: 5,
    shortDescription: {
      en: "Upload image to IMGBB"
    },
    longDescription: {
      en: "Upload any image from URL or reply to an image message to get direct IMGBB link"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const CONFIG_URL = "https://raw.githubusercontent.com/likhontheoldstyle/LIKHON-APiS-JSON/refs/heads/main/imgbb-api/imgbb.json";
    
    try {
      let imageUrl = null;
      
      if (event.messageReply) {
        if (event.messageReply.attachments && event.messageReply.attachments.length > 0) {
          const attachment = event.messageReply.attachments[0];
          if (attachment.type === "photo" || attachment.type === "animated_image") {
            imageUrl = attachment.url;
          } else {
            return message.reply("❌ Please reply to an image message only.");
          }
        } else {
          return message.reply("❌ The replied message has no image attachment.");
        }
      } else if (args.length > 0) {
        imageUrl = args[0];
        if (!imageUrl.match(/^https?:\/\/.+/)) {
          return message.reply("❌ Invalid URL format. Please provide a valid URL starting with http:// or https://");
        }
      } else {
        return message.reply("❌ Please provide an image URL or reply to an image message.\n\nExample: /imgg https://example.com/image.jpg");
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      
      const uploadMsg = await message.reply("⏫ Uploading image to IMGBB...");

      const configResponse = await axios.get(CONFIG_URL);
      const apiUrl = configResponse.data.api;

      const uploadResponse = await axios.get(`${apiUrl}?url=${encodeURIComponent(imageUrl)}`, {
        timeout: 30000
      });

      const result = uploadResponse.data;

      if (result.success) {
        const directLink = result.data.url;
        
        await message.unsend(uploadMsg.messageID);
        
        await message.reply(directLink);
        
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      } else {
        await message.unsend(uploadMsg.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply(`❌ Upload failed: ${result.error || "Unknown error"}`);
      }

    } catch (error) {
      console.error("IMGBB Error:", error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      
      if (error.response) {
        return message.reply(`❌ API Error: ${error.response.data.error || error.message}`);
      } else if (error.request) {
        return message.reply("❌ Network error. Please try again later.");
      } else {
        return message.reply(`❌ Error: ${error.message}`);
      }
    }
  }
};
