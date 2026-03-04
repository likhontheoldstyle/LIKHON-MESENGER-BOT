const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (
	api,
	threadModel,
	userModel,
	dashBoardModel,
	globalModel,
	usersData,
	threadsData,
	dashBoardData,
	globalData
) => {
	const handlerEvents = require(
		process.env.NODE_ENV == "development"
			? "./handlerEvents.dev.js"
			: "./handlerEvents.js"
	)(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

	return async function (event) {
		if (
			global.GoatBot.config.antiInbox == true &&
			(event.senderID == event.threadID ||
				event.userID == event.senderID ||
				event.isGroup == false) &&
			(event.senderID || event.userID || event.isGroup == false)
		)
			return;

		const message = createFuncMessage(api, event);

		if (global.GoatBot.config.noPrefixMode && event.body && !event.body.startsWith(global.GoatBot.config.prefix)) {
			event.body = global.GoatBot.config.prefix + event.body;
		}

		await handlerCheckDB(usersData, threadsData, event);

		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat) return;

		const {
			onAnyEvent,
			onFirstChat,
			onStart,
			onChat,
			onReply,
			onEvent,
			handlerEvent,
			onReaction,
			typ,
			presence,
			read_receipt,
		} = handlerChat;

		onAnyEvent();

		switch (event.type) {
			case "message":
			case "message_reply":
			case "message_unsend":
				onFirstChat();
				onChat();
				onStart();
				onReply();
				break;

			case "event":
				handlerEvent();
				onEvent();
				break;

			case "message_reaction":
				if (["🤦", "😠", "😡", "🤬"].includes(event.reaction)) {
					if (event.senderID === api.getCurrentUserID()) {
						const adminBotList = global.GoatBot.config.adminBot || []; 
						if (adminBotList.includes(event.userID)) {
							api.unsendMessage(event.messageID);
						}
					}
				}

				onReaction();
				break;

			case "typ":
				typ();
				break;

			case "presence":
				presence();
				break;

			case "read_receipt":
				read_receipt();
				break;

			default:
				break;
		}
	};
};
