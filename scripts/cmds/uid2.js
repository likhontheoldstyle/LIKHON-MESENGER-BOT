const axios = require('axios');

module.exports = {
    config: {
        name: "uid2",
        version: "1.0",
        author: "LIKHON AHMED",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "Get Facebook UID from username"
        },
        description: {
            en: "Get Facebook UID from username or profile link"
        },
        category: "info",
        guide: {
            en: "use /uid2 [username or profile link]\nExample: /uid2 T0MA1SLAM\nOr: /uid2 https://username-to-uid.vercel.app/find-uid?id=T0MA1SLAM"
        }
    },

    langs: {
        en: {
            processing: "🔍 Processing your request...",
            error: "❌ Error: %1",
            noInput: "⚠ Please provide a username or profile link",
            success: "✅ Username: %1\n🆔 UID: %2\n\n👤 Profile: https://facebook.com/%2",
            invalidFormat: "❌ Invalid input format. Please provide a valid username or API link"
        }
    },

    onStart: async function ({ api, args, message, event, getLang }) {
        const input = args.join(" ").trim();
        
        if (!input) {
            return message.reply(getLang("noInput"));
        }

        const processingMsg = await message.reply(getLang("processing"));

        try {
            let username;
            
            if (input.includes('username-to-uid.vercel.app/find-uid?id=')) {
                const urlMatch = input.match(/[?&]id=([^&]+)/);
                if (urlMatch && urlMatch[1]) {
                    username = urlMatch[1];
                } else {
                    throw new Error(getLang("invalidFormat"));
                }
            } else {
                username = input;
            }

            username = username.trim();
            const response = await axios.get(`https://username-to-uid.vercel.app/find-uid?id=${encodeURIComponent(username)}`);

            if (response.data && Array.isArray(response.data) && response.data.length >= 1) {
                const result = response.data[0].info;
                
                if (result.status === "success") {
                    const uid = result.UID;
                    const displayUsername = result.username;
                    const replyMessage = getLang("success", displayUsername, uid);
                    
                    await message.reply(replyMessage);
                } else {
                    throw new Error("API returned unsuccessful status");
                }
            } else {
                throw new Error("Invalid API response format");
            }

        } catch (error) {
            console.error("UID2 Command Error:", error);
            
            let errorMessage = getLang("error", error.message);
            
            if (error.response && error.response.status === 404) {
                errorMessage = getLang("error", "Username not found or invalid");
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = getLang("error", "API server is not responding");
            }
            
            await message.reply(errorMessage);
        }
    }
};
