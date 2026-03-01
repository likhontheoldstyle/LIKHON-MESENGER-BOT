const axios = require("axios");

module.exports = {
	config: {
		name: "voice",
		version: "1.0.0",
		author: "LIKHON AHMED",
		countDown: 5,
		role: 0,
		shortDescription: {
			vi: "Phát giọng từ Noobs API",
			en: "Play voices from Noobs API"
		},
		description: {
			vi: "Cho phép bạn xem danh sách giọng và phát giọng từ Noobs Voice API",
			en: "Allows you to view the list of voices and play voices from Noobs Voice API"
		},
		category: "tools",
		guide: {
			vi: "{pn} list - Xem danh sách giọng\n{pn} <voiceName> - Phát giọng",
			en: "{pn} list - Show voice list\n{pn} <voiceName> - Play voice"
		}
	},

	langs: {
		vi: {
			invalidOption: "Tùy chọn không hợp lệ. Dùng: list hoặc <voiceName>",
			noVoices: "Không tìm thấy giọng nào.",
			errorFetching: "Lỗi khi lấy danh sách giọng.",
			failedPlay: "Không thể phát giọng. Kiểm tra tên giọng."
		},
		en: {
			invalidOption: "Invalid option. Use: list or <voiceName>",
			noVoices: "No voices found.",
			errorFetching: "Error fetching voice list.",
			failedPlay: "Failed to play voice. Make sure the name is correct."
		}
	},

	onStart: async function ({ api, event, args, getLang }) {
		if (!args[0]) return api.sendMessage(getLang("invalidOption"), event.threadID);

		const option = args[0].toLowerCase();

		if (option === "list") {
			try {
				const res = await axios.get("https://himu-voice-api.vercel.app/list");
				const data = res.data;

				let voices = [];
				if (Array.isArray(data)) voices = data;
				else if (data.voices && Array.isArray(data.voices)) voices = data.voices;

				if (voices.length === 0) return api.sendMessage(getLang("noVoices"), event.threadID);

				const names = voices.map(v => v.replace(".mp3","")).join("\n");
				return api.sendMessage(`🐣 Available voices:\n${names}`, event.threadID);
			} catch {
				return api.sendMessage(getLang("errorFetching"), event.threadID);
			}
		} else {
			const voiceName = args[0];
			const url = `https://himu-voice-api.vercel.app/voice/${voiceName}`;
			try {
				return api.sendMessage({attachment: await global.utils.getStreamFromURL(url)}, event.threadID);
			} catch {
				return api.sendMessage(getLang("failedPlay"), event.threadID);
			}
		}
	}
};
