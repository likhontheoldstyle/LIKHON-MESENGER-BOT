const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "wanted",
    aliases: ["wanted", "chorgang"],
    version: "2.0",
    author: "U. LIKHON AHMED",
    countDown: 5,
    role: 0,
    shortdescription: "wanted frame for fun purpose",
    longDescription: "Create wanted poster with multiple users",
    category: "fun",
    guide: "{pn} @tag @tag OR {pn} [reply to message] OR {pn] 100000... 200000..."
  },

  onStart: async function ({ message, event, args }) {
    const uid1 = [];
    
  
    if (event.messageReply) {
      const repliedUserID = event.messageReply.senderID;
      uid1.push(repliedUserID);
    }
    
    
    if (Object.keys(event.mentions).length > 0) {
      for (const id of Object.keys(event.mentions)) {
        uid1.push(id);
      }
    }
    
    
    if (args.length > 0) {
      for (const arg of args) {
        if (!isNaN(arg) && arg.length >= 10) { // Check if it's a valid UID
          uid1.push(arg);
        }
      }
    }
    
    
    if (uid1.length === 0) {
      uid1.push(event.senderID);
    }
    
  
    const selectedUIDs = uid1.slice(0, 3);
    
    
    if (selectedUIDs.length === 1) {
      selectedUIDs.push(event.senderID);
    }
    
    
    if (selectedUIDs.length === 2) {
      selectedUIDs.push(selectedUIDs[0]); 
    }
    
    
    while (selectedUIDs.length < 3) {
      selectedUIDs.push(event.senderID);
    }
    
    const [one, two, three] = selectedUIDs;
    
    try {
      const imagePath = await bal(one, two, three);
      
      
      let mentionList = [];
      for (const uid of selectedUIDs) {
        if (uid !== event.senderID) {
          mentionList.push({
            tag: `@${uid}`,
            id: uid
          });
        }
      }
      
      const replyMsg = `⚠️ | WANTED\n━━━━━━━━━━━━━━\n`;
      const mentions = mentionList.map(m => ({
        tag: m.tag,
        id: m.id
      }));
      
      await message.reply({
        body: replyMsg + mentions.map(m => m.tag).join(', ') + ' are wanted!',
        mentions: mentions,
        attachment: fs.createReadStream(imagePath)
      });
      
    } catch (error) {
      console.error("Error while running command:", error);
      await message.reply("❌ An error occurred while creating wanted poster");
    }
  }
};

async function bal(one, two, three) {
  try {
  
    let avatarOne, avatarTwo, avatarThree;
    
    try {
      avatarOne = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    } catch (err) {
      avatarOne = await jimp.read("https://i.ibb.co/4T7B4Kc/default-avatar.png"); // Default avatar
    }
    
    try {
      avatarTwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    } catch (err) {
      avatarTwo = await jimp.read("https://i.ibb.co/4T7B4Kc/default-avatar.png"); // Default avatar
    }
    
    try {
      avatarThree = await jimp.read(`https://graph.facebook.com/${three}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    } catch (err) {
      avatarThree = await jimp.read("https://i.ibb.co/4T7B4Kc/default-avatar.png"); // Default avatar
    }

    
    let image;
    try {
      image = await jimp.read("https://i.ibb.co/7yPR6Xf/image.jpg");
    } catch (err) {
    
      if (fs.existsSync(__dirname + "/assets/image/wanted_bg.jpg")) {
        image = await jimp.read(__dirname + "/assets/image/wanted_bg.jpg");
      } else {
        throw new Error("Could not load background image");
      }
    }
    
    
    image.resize(2452, 1226);
    
    
    avatarOne.resize(405, 405);
    avatarTwo.resize(400, 400);
    avatarThree.resize(450, 450);
    
    
    avatarOne.circle();
    avatarTwo.circle();
    avatarThree.circle();
    
    
    image.composite(avatarOne, 206, 345)
         .composite(avatarTwo, 1830, 350)
         .composite(avatarThree, 1010, 315);
    
    
    const imagePath = __dirname + "/tmp/wanted_" + Date.now() + ".png";
    
    
    const tmpDir = __dirname + "/tmp";
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    await image.writeAsync(imagePath);
    return imagePath;
    
  } catch (error) {
    console.error("Error in bal function:", error);
    throw error;
  }
  }
