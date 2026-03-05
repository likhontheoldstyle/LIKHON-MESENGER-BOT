module.exports = {
  config: {
    name: "noprefix",
    version: "1.0.1",
    role: 2, 
    author: "MOHAMMAD-BADOL",
    description: "Enable/disable no prefix mode for all commands (only works with valid command names)",
    category: "system",
    guide: "{pn} on/off\n{pn} status - check current status",
    countDown: 5,
    aliases: ["np", "noprefixmode"]
  },

  onStart: async function ({ message, args, api }) {
    const status = args[0]?.toLowerCase();

    if (status === "on") {
      global.GoatBot.config.noPrefixMode = true;
      return message.reply("✅ No Prefix Mode Enabled\n\nNow only valid command names will work without prefix. Random text, emoji or links will be ignored.");
    } 
    else if (status === "off") {
      global.GoatBot.config.noPrefixMode = false;
      return message.reply("❌ No Prefix Mode Disabled\n\nNow all commands require prefix (e.g., /) to work.");
    }
    else if (status === "status") {
      const currentStatus = global.GoatBot.config.noPrefixMode ? "ON" : "OFF";
      return message.reply(`📊 No Prefix Mode Status: ${currentStatus}\n\nWhen enabled, only valid command names will work without prefix.`);
    }
    else {
      return message.reply(
        "⚙️ No Prefix Command Usage:\n\n" +
        "→ noprefix on - Enable\n" +
        "→ noprefix off - Disable\n" +
        "→ noprefix status - Check status"
      );
    }
  }
};
