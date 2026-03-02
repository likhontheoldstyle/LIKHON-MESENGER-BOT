const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "checkcmdname",
    version: "1.1",
    author: "LIKHON AHMED",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Check commands by letter"
    },
    longDescription: {
      en: "Find all commands that start with a specific letter"
    },
    category: "info",
    guide: {
      en: "{p}checkcmdname [letter]\nExample: {p}checkcmdname p"
    }
  },

  langs: {
    en: {
      noLetter: "⚠️ Please provide a letter to search.\nExample: /checkcmdname p",
      invalidInput: "⚠️ Please provide a single letter (a-z or A-Z).",
      noCommands: "📁 No commands found starting with '%1'",
      result: "📁 **Commands starting with '%1'**\n━━━━━━━━━━━━━━━━━━\n%2\n━━━━━━━━━━━━━━━━━━\n📊 Total: %3 commands",
      error: "❌ Error: %1",
      checking: "🔍 Searching for commands starting with '%1'..."
    }
  },

  onStart: async ({ api, event, args, getLang }) => {
    try {
      const input = args[0]?.toLowerCase();

      if (!input) {
        return api.sendMessage(getLang("noLetter"), event.threadID);
      }

      if (input.length !== 1 || !/[a-z]/i.test(input)) {
        return api.sendMessage(getLang("invalidInput"), event.threadID);
      }

      
      const processingMsg = await api.sendMessage(getLang("checking", input), event.threadID);

      
      const possiblePaths = [
        path.join(__dirname, "..", "cmds"),                    // ../cmds from current file
        path.join(__dirname, "..", "commands"),                // ../commands
        path.join(__dirname, "..", "scripts", "cmds"),         // ../scripts/cmds
        path.join(__dirname, "..", "..", "cmds"),              // ../../cmds
        path.join(__dirname, "..", "..", "commands"),          // ../../commands
        path.join(process.cwd(), "cmds"),                      // current working directory/cmds
        path.join(process.cwd(), "commands"),                  // current working directory/commands
        path.join(process.cwd(), "scripts", "cmds")            // current working directory/scripts/cmds
      ];

      let cmdsPath = null;
      let files = [];

      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          const testFiles = fs.readdirSync(testPath).filter(f => f.endsWith(".js"));
          if (testFiles.length > 0) {
            cmdsPath = testPath;
            files = testFiles;
            break;
          }
        }
      }

      
      if (!cmdsPath && global.client && global.client.commandPath) {
        cmdsPath = global.client.commandPath;
        if (fs.existsSync(cmdsPath)) {
          files = fs.readdirSync(cmdsPath).filter(f => f.endsWith(".js"));
        }
      }

    
      if (!cmdsPath || files.length === 0) {
        const searchPaths = [
          path.join(__dirname, ".."),
          path.join(__dirname, "..", ".."),
          process.cwd()
        ];

        for (const searchPath of searchPaths) {
          const foundFiles = await findJsFilesRecursively(searchPath, ["cmds", "commands", "scripts/cmds"]);
          if (foundFiles.length > 0) {
            files = foundFiles;
            break;
          }
        }
      }

      
      await api.unsendMessage(processingMsg.messageID);

      if (files.length === 0) {
        return api.sendMessage("📁 No command files found in any known locations.\nPlease check your bot structure.", event.threadID);
      }

      const matchingCommands = files
        .map(file => path.basename(file, ".js"))
        .filter(cmd => cmd.toLowerCase().startsWith(input))
        .sort();

      if (matchingCommands.length === 0) {
        return api.sendMessage(getLang("noCommands", input), event.threadID);
      }

      const numberedList = matchingCommands
        .map((cmd, index) => `${index + 1}. ${cmd}`)
        .join("\n");

      const resultMessage = getLang("result", input, numberedList, matchingCommands.length);

      api.sendMessage(resultMessage, event.threadID);

    } catch (error) {
      console.error("CheckCmdName Error:", error);
      api.sendMessage(getLang("error", error.message), event.threadID);
    }
  }
};


async function findJsFilesRecursively(basePath, targetFolders) {
  let jsFiles = [];
  
  for (const folder of targetFolders) {
    const fullPath = path.join(basePath, folder);
    if (fs.existsSync(fullPath)) {
      try {
        const files = fs.readdirSync(fullPath);
        const jsFilesInFolder = files
          .filter(f => f.endsWith(".js"))
          .map(f => path.join(fullPath, f));
        jsFiles = [...jsFiles, ...jsFilesInFolder];
      } catch (err) {
      
      }
    }
  }
  
  return jsFiles;
                               }
