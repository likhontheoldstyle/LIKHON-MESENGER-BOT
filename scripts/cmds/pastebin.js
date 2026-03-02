const PastebinAPI = require('pastebin-js');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "pastebin",
    version: "1.4",
    aliases: ["p-bin", "bin"],
    author: "LIKHON AHMED",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Upload files to Pastebin"
    },
    longDescription: {
      en: "Upload files from cmds folder to Pastebin and get shareable link"
    },
    category: "owner",
    guide: {
      en: "Use: {p}pastebin <filename>\nExample: {p}pastebin mycmd"
    }
  },

  langs: {
    en: {
      ownerOnly: "❌ This command is only for bot owners!",
      noFile: "❌ Please provide a filename.\nExample: {p}pastebin mycmd",
      fileNotFound: "❌ File '%1.js' not found in cmds folder.",
      uploadSuccess: "✅ File uploaded successfully!\n\n📁 Filename: %1.js\n🔗 Link: %2\n📦 Size: %3 KB",
      uploadError: "❌ Error uploading file: %1",
      processing: "⏳ Uploading file to Pastebin..."
    }
  },

  onStart: async function ({ api, event, args, getLang }) {
    const ownerID = ["61572915213085", "YOUR_OWNER_ID_HERE"];
    
    if (!ownerID.includes(event.senderID)) {
      return api.sendMessage(getLang("ownerOnly"), event.threadID, event.messageID);
    }

    if (!args[0]) {
      return api.sendMessage(getLang("noFile"), event.threadID, event.messageID);
    }

    const processingMsg = await api.sendMessage(getLang("processing"), event.threadID);

    try {
      const pastebin = new PastebinAPI({
        api_dev_key: 'LFhKGk5aRuRBII5zKZbbEpQjZzboWDp9'
      });

      const fileName = args[0].replace(/\.js$/g, "");
      
      const possiblePaths = [
        path.join(__dirname, '..', 'cmds', fileName + '.js'),
        path.join(__dirname, '..', 'commands', fileName + '.js'),
        path.join(__dirname, '..', 'scripts', 'cmds', fileName + '.js'),
        path.join(process.cwd(), 'cmds', fileName + '.js'),
        path.join(process.cwd(), 'commands', fileName + '.js')
      ];

      let filePath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }

      if (!filePath) {
        await api.unsendMessage(processingMsg.messageID);
        return api.sendMessage(getLang("fileNotFound", fileName), event.threadID, event.messageID);
      }

      const stats = fs.statSync(filePath);
      const fileSizeInKB = (stats.size / 1024).toFixed(2);

      const data = fs.readFileSync(filePath, 'utf8');

      const paste = await pastebin.createPaste({
        text: data,
        title: fileName + '.js',
        format: 'javascript',
        privacy: 1
      });

      const rawUrl = paste.replace(/^https?:\/\/pastebin\.com\//, 'https://pastebin.com/raw/');

      await api.unsendMessage(processingMsg.messageID);

      const successMessage = getLang("uploadSuccess", fileName, rawUrl, fileSizeInKB);
      
      api.sendMessage(successMessage, event.threadID, event.messageID);

    } catch (error) {
      console.error("Pastebin Error:", error);
      await api.unsendMessage(processingMsg.messageID);
      
      let errorMessage = error.message;
      if (error.message.includes("Invalid api_dev_key")) {
        errorMessage = "Invalid Pastebin API key. Please check your API key.";
      } else if (error.message.includes("Connection refused")) {
        errorMessage = "Network error. Please try again later.";
      }
      
      api.sendMessage(getLang("uploadError", errorMessage), event.threadID, event.messageID);
    }
  }
};
