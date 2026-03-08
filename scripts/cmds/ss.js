const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const API_CONFIG_URL = 'https://raw.githubusercontent.com/likhontheoldstyle/LIKHON-APiS-JSON/refs/heads/main/ss-api/ss_api.json';

module.exports = {
  config: {
    name: "ss",
    version: "1.1.0",
    author: "LIKHON AHMED",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Take a screenshot of any website"
    },
    longDescription: {
      en: "This command takes a screenshot of any provided URL using a free screenshot API."
    },
    category: "utility",
    guide: {
      en: "{pn} <url>"
    }
  },

  langs: {
    en: {
      noUrl: "❌ Please provide a URL. Usage: /ss <url>",
      invalidUrl: "❌ The provided URL is invalid. Please make sure it starts with http:// or https://",
      processing: "⏳ Taking screenshot, please wait...",
      apiError: "❌ Failed to fetch API configuration: {error}",
      success: "✅ Screenshot of: {url}",
      error: "❌ Failed to take screenshot: {error}"
    }
  },

  onStart: async function ({ api, event, args, message, getLang }) {
    const senderID = event.senderID;
    const threadID = event.threadID;
    const messageID = event.messageID;

    const inputURL = args.join(" ");
    if (!inputURL) {
      return message.reply(getLang("noUrl"));
    }

    let urlToScreenshot;
    try {
      urlToScreenshot = new URL(inputURL).toString();
    } catch (err) {
      return message.reply(getLang("invalidUrl"));
    }

    const processingMessage = await message.reply(getLang("processing"));

    try {
      const apiConfigResponse = await axios.get(API_CONFIG_URL);
      
      const apiEndpoint = apiConfigResponse.data.api;
      
      if (!apiEndpoint) {
        throw new Error('API endpoint not found in configuration');
      }

      const baseApiUrl = apiEndpoint.split('?url=')[0];
      const fullApiUrl = `${baseApiUrl}?url=${encodeURIComponent(urlToScreenshot)}`;

      const response = await axios({
        method: 'get',
        url: fullApiUrl,
        responseType: 'arraybuffer'
      });

      if (response.status !== 200) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const imageBuffer = Buffer.from(response.data, 'binary');
      
      const imagePath = path.join(__dirname, 'tmp', `${Date.now()}_screenshot.png`);
      
      await fs.ensureDir(path.join(__dirname, 'tmp'));
      
      await fs.writeFile(imagePath, imageBuffer);

      await api.sendMessage(
        {
          body: getLang("success", { url: urlToScreenshot }),
          attachment: fs.createReadStream(imagePath)
        },
        threadID,
        (err) => {
          fs.unlink(imagePath)
            .then(() => console.log(`✅ Deleted temporary file: ${imagePath}`))
            .catch(e => console.error(`❌ Error deleting file: ${e.message}`));
          
          if (err) console.error("❌ Error sending message:", err);
        },
        messageID
      );

    } catch (error) {
      console.error("❌ Screenshot error:", error);
      
      if (error.response && error.response.status === 404) {
        await message.reply(getLang("error", { error: "API endpoint not found" }));
      } else if (error.code === 'ENOTFOUND') {
        await message.reply(getLang("error", { error: "Network error - please check your connection" }));
      } else {
        await message.reply(getLang("error", { error: error.message }));
      }
    } finally {
      try {
        await api.unsendMessage(processingMessage.messageID);
      } catch (e) {
      }
    }
  }
};
