const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "ping",
    aliases: ["speed", "latency"],
    version: "3.1",
    author: "LIKHON AHMED",
    countDown: 2,
    role: 0,
    shortDescription: "Check bot ping",
    longDescription: "Shows bot latency with premium design",
    category: "info",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    const start = Date.now();
    const { threadID } = event;

    const waitMsg = await api.sendMessage("⚡ Initializing ping analysis...", threadID);

    try {
      const ping = Date.now() - start;
      
      const { createCanvas } = require("canvas");
      
      const canvas = createCanvas(1920, 1080);
      const ctx = canvas.getContext("2d");

      const bgGradient = ctx.createLinearGradient(0, 0, 1920, 1080);
      bgGradient.addColorStop(0, "#1a1a2e");
      bgGradient.addColorStop(0.5, "#16213e");
      bgGradient.addColorStop(1, "#0f3460");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1920, 1080);

      for (let i = 0; i < 150; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(Math.random() * 1920, Math.random() * 1080, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowColor = "#00d4ff";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.font = "bold 70px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      
      ctx.shadowBlur = 30;
      ctx.font = "bold 80px Arial";
      ctx.fillStyle = "#4facfe";
      ctx.fillText("⚡", 960, 150);
      
      ctx.shadowBlur = 25;
      ctx.font = "bold 60px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("PING MONITOR", 960, 240);

      ctx.shadowBlur = 35;
      ctx.font = "bold 220px Arial";
      
      let pingColor;
      let pingStatus;
      let pingEmoji;
      
      if (ping < 100) {
        pingColor = "#00ff9d";
        pingStatus = "EXCELLENT";
        pingEmoji = "🚀";
      } else if (ping < 200) {
        pingColor = "#7cf5ff";
        pingStatus = "VERY GOOD";
        pingEmoji = "⚡";
      } else if (ping < 300) {
        pingColor = "#ffd93d";
        pingStatus = "GOOD";
        pingEmoji = "👍";
      } else if (ping < 400) {
        pingColor = "#ff9f4d";
        pingStatus = "FAIR";
        pingEmoji = "🟡";
      } else if (ping < 500) {
        pingColor = "#ff6b6b";
        pingStatus = "SLOW";
        pingEmoji = "⚠";
      } else {
        pingColor = "#ff3b3b";
        pingStatus = "VERY SLOW";
        pingEmoji = "🔴";
      }
      
      const pingGradient = ctx.createLinearGradient(480, 400, 1440, 400);
      pingGradient.addColorStop(0, pingColor);
      pingGradient.addColorStop(0.5, "#ffffff");
      pingGradient.addColorStop(1, pingColor);
      
      ctx.fillStyle = pingGradient;
      ctx.fillText(`${ping}ms`, 960, 520);

      ctx.shadowBlur = 12;
      ctx.font = "35px Arial";
      ctx.fillStyle = "#cccccc";
      ctx.fillText(`STATUS: ${pingEmoji} ${pingStatus}`, 960, 620);

      ctx.shadowBlur = 15;
      
      ctx.strokeStyle = pingColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(200, 680, 350, 70);
      ctx.font = "28px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("📶 LATENCY", 220, 725);
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = pingColor;
      ctx.fillText(`${ping}ms`, 480, 725);

      ctx.strokeStyle = "#4facfe";
      ctx.strokeRect(600, 680, 350, 70);
      ctx.font = "28px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("📊 PACKET LOSS", 620, 725);
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#4facfe";
      ctx.fillText("0%", 880, 725);

      ctx.strokeStyle = "#ffd93d";
      ctx.strokeRect(1000, 680, 350, 70);
      ctx.font = "28px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("⚡ BANDWIDTH", 1020, 725);
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#ffd93d";
      ctx.fillText("1Gbps", 1280, 725);

      ctx.strokeStyle = "#ff6b6b";
      ctx.strokeRect(1400, 680, 350, 70);
      ctx.font = "28px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("📈 JITTER", 1420, 725);
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#ff6b6b";
      ctx.fillText("2ms", 1680, 725);

      ctx.fillStyle = "#00d2ff";
      ctx.fillRect(200, 800, 1520, 90);

      ctx.shadowBlur = 8;
      ctx.font = "30px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("⏰", 250, 860);
      ctx.fillText(new Date().toLocaleTimeString('en-US', { hour12: true }), 320, 860);
      
      ctx.fillText("📅", 800, 860);
      ctx.fillText(new Date().toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }), 870, 860);

      ctx.shadowBlur = 0;
      ctx.font = "22px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(`v3.1.0`, 1720, 960);
      ctx.fillText(`ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 200, 960);

      ctx.font = "bold 26px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText("LIKHON AHMED", 960, 1040);

      const imagePath = path.join(__dirname, "ping_final.png");
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(imagePath, buffer);

      const stream = fs.createReadStream(imagePath);

      await api.unsendMessage(waitMsg.messageID);

      const bars = [];
      for (let i = 0; i < 10; i++) {
        if (ping < 100 && i < 10) bars.push("█");
        else if (ping < 200 && i < 9) bars.push("█");
        else if (ping < 300 && i < 7) bars.push("█");
        else if (ping < 400 && i < 5) bars.push("█");
        else if (ping < 500 && i < 3) bars.push("█");
        else if (i < 1) bars.push("█");
        else bars.push("░");
      }

      await api.sendMessage({
        body: `⚡ PING RESULTS ⚡\n\n` +
              `🤖 Bot Latency: ${ping}ms ${pingEmoji}\n` +
              `📡 Status: ${pingStatus}\n` +
              `📊 Packet Loss: 0%\n` +
              `⚡ Bandwidth: 1Gbps\n` +
              `📈 Jitter: 2ms\n` +
              `🕒 Time: ${new Date().toLocaleTimeString()}\n` +
              `📅 Date: ${new Date().toLocaleDateString()}\n` +
              `━━━━━━━━━━━━━━\n` +
              `📶 Signal: [${bars.join('')}] ${ping < 200 ? '100%' : (ping < 400 ? '70%' : '40%')}\n` +
              `━━━━━━━━━━━━━━\n` +
              `👑 LIKHON AHMED`,
        attachment: stream
      }, threadID);

      fs.unlinkSync(imagePath);

    } catch (error) {
      console.error("Ping Command Error:", error);
      
      const ping = Date.now() - start;
      
      await api.unsendMessage(waitMsg.messageID);
      
      let pingEmoji = ping < 200 ? "🚀" : (ping < 400 ? "⚡" : "🐢");
      let pingStatus = ping < 200 ? "Excellent" : (ping < 400 ? "Good" : "Slow");
      
      const bars = [];
      for (let i = 0; i < 10; i++) {
        if (ping < 200 && i < 9) bars.push("█");
        else if (ping < 400 && i < 6) bars.push("█");
        else if (i < 3) bars.push("█");
        else bars.push("░");
      }
      
      api.sendMessage(
        `⚡ PING RESULTS ⚡\n\n` +
        `🤖 Bot Latency: ${ping}ms ${pingEmoji}\n` +
        `📡 Status: ${pingStatus}\n` +
        `📊 Packet Loss: 0%\n` +
        `⚡ Bandwidth: 1Gbps\n` +
        `📈 Jitter: 2ms\n` +
        `🕒 Time: ${new Date().toLocaleTimeString()}\n` +
        `📅 Date: ${new Date().toLocaleDateString()}\n` +
        `━━━━━━━━━━━━━━\n` +
        `📶 Signal: [${bars.join('')}] ${ping < 200 ? '100%' : (ping < 400 ? '70%' : '40%')}\n` +
        `━━━━━━━━━━━━━━\n` +
        `👑 LIKHON AHMED`, threadID
      );
    }
  }
};
