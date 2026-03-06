module.exports = {
  config: {
    name: "anti",
    version: "1.0",
    author: "MOHAMMAD-BADOL",
    role: 0,
    shortDescription: "Auto re-add when someone leaves",
    category: "box chat"
  },

  onStart: async function () {
    // command run করলে কিছু করবে না
  },

  onEvent: async function ({ api, event }) {
    try {
      if (event.logMessageType === "log:unsubscribe") {

        const userId = event.logMessageData.leftParticipantFbId;

        if (userId !== api.getCurrentUserID()) {

          try {
            await api.addUserToGroup(userId, event.threadID);

            const userInfo = await api.getUserInfo(userId);
            const userName = userInfo[userId].name;

            api.sendMessage({
              body: `😹 ${userName} কোথায় যাস? আবার গ্রুপে ঢুক 😹`,
              mentions: [{ tag: userName, id: userId }]
            }, event.threadID);

          } catch (e) {
            console.log("Can't re-add user");
          }
        }
      }

    } catch (error) {
      console.error(error);
    }
  }
};
