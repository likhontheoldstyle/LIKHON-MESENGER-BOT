const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "getfbstate",
    aliases: ["getstate", "getcookie"],
    version: "1.3",
    author: "LIKHON AHMED",
    countDown: 5,
    role: 2,
    description: {
      vi: "Lấy fbstate hiện tại",
      en: "Get current fbstate"
    },
    category: "owner",
    guide: {
      en: "{pn} - get fbstate (appState)\n{pn} cookie - get cookies format\n{pn} string - get string format",
      vi: "{pn} - lấy fbstate (appState)\n{pn} cookie - lấy dạng cookies\n{pn} string - lấy dạng string"
    }
  },

  langs: {
    vi: {
      success: "✅ Đã gửi fbstate vào nhóm!",
      error: "❌ Lỗi: %1"
    },
    en: {
      success: "✅ Fbstate has been sent to the group!",
      error: "❌ Error: %1"
    }
  },

  onStart: async function ({ message, api, event, args, getLang }) {
    try {
      let fbstate;
      let fileName;
      let fileContent;

      if (["cookie", "cookies", "c"].includes(args[0])) {
        fbstate = api.getAppState().map(e => ({
          name: e.key,
          value: e.value
        }));
        fileName = "cookies.json";
        fileContent = JSON.stringify(fbstate, null, 2);
      }
      else if (["string", "str", "s"].includes(args[0])) {
        fbstate = api.getAppState().map(e => `${e.key}=${e.value}`).join("; ");
        fileName = "cookiesString.txt";
        fileContent = fbstate;
      }
      else {
        fbstate = api.getAppState();
        fileName = "appState.json";
        fileContent = JSON.stringify(fbstate, null, 2);
      }

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);
      
      const pathSave = path.join(tmpDir, fileName);
      await fs.writeFile(pathSave, fileContent);

      const responseMessage = 
        `╭━━━━━━━━━━━━━━━━╮\n` +
        `   📁 Fbstate File   \n` +
        `╰━━━━━━━━━━━━━━━━╯\n\n` +
        `📄 File: ${fileName}\n` +
        `📦 Size: ${(fileContent.length / 1024).toFixed(2)} KB\n` +
        `⏰ Time: ${new Date().toLocaleTimeString()}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `⚠ Keep this file secure!\n` +
        `👑 LIKHON AHMED`;

      await api.sendMessage({
        body: responseMessage,
        attachment: fs.createReadStream(pathSave)
      }, event.threadID, (err) => {
        if (err) console.error("Send error:", err);
        fs.unlink(pathSave).catch(console.error);
      });

      if (event.senderID !== event.threadID) {
        await message.reply(getLang("success"));
      }

    } catch (error) {
      console.error("Getfbstate Error:", error);
      return api.sendMessage(getLang("error", error.message), event.threadID);
    }
  }
};
