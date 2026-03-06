const { getTime, drive } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "2.0",
		author: "NTKhang + Fix by BADOL",
		category: "events"
	},

	onStart: async ({ threadsData, message, event, api, usersData }) => {
		if (event.logMessageType == "log:unsubscribe") {
			return async function () {

				const { threadID } = event;
				const threadData = await threadsData.get(threadID);

				if (!threadData.settings.sendLeaveMessage)
					return;

				const { leftParticipantFbId } = event.logMessageData;

				if (leftParticipantFbId == api.getCurrentUserID())
					return;

				let userName = await usersData.getName(leftParticipantFbId);

				if (!userName) {
					const userInfo = await api.getUserInfo(leftParticipantFbId);
					userName = userInfo[leftParticipantFbId]?.name || "Unknown";
				}

				let firstName = userName.split(" ")[0];

				let leaveMessages = [
					`${firstName} rag kore group theke ber hoye gese 😹`,
					`Arey ${firstName} koi geli re! group chere dili 😿`,
					`${firstName} group theke vanish hoye gese 👻`,
					`${firstName} ar thakte parlo na, chole gelo 😆`,
					`Biday ${firstName}! abar fire ashish 😹`
				];

				let kickMessages = [
					`${firstName} ke group theke kick mara hoise 🤣`,
					`Admin ra ${firstName} ke ber kore dise 😹`,
					`${firstName} er visa cancel hoye gese group theke 😆`,
					`${firstName} ke group theke ber kore dewa hoise 😼`,
					`${firstName} beshi dustami korse tai kick 😹`
				];

				let leaveMessage;

				if (leftParticipantFbId == event.author) {
					leaveMessage = leaveMessages[Math.floor(Math.random() * leaveMessages.length)];
				}
				else {
					leaveMessage = kickMessages[Math.floor(Math.random() * kickMessages.length)];
				}

				const form = {
					body: leaveMessage,
					mentions: [{
						id: leftParticipantFbId,
						tag: firstName
					}]
				};

				message.send(form);
			};
		}
	}
};
