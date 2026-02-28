const axios = require("axios");
const moment = require("moment-timezone");
const Canvas = require("canvas");
const fs = require("fs-extra");

Canvas.registerFont(
    __dirname + "/assets/font/BeVietnamPro-SemiBold.ttf", {
    family: "BeVietnamPro-SemiBold"
});
Canvas.registerFont(
    __dirname + "/assets/font/BeVietnamPro-Regular.ttf", {
    family: "BeVietnamPro-Regular"
});

function convertFtoC(F) {
    return Math.floor((F - 32) / 1.8);
}
function formatHours(hours) {
    return moment(hours).tz("Asia/Ho_Chi_Minh").format("HH[h]mm[p]");
}

module.exports = {
    config: {
        name: "weather",
        version: "1.2",
        author: "F. LIKHON AHMED",
        countDown: 5,
        role: 0,
        description: {
            vi: "xem dự báo thời tiết hiện tại và 5 ngày sau",
            en: "view the current and next 5 days weather forecast"
        },
        category: "other",
        guide: {
            vi: "{pn} <địa điểm>",
            en: "{pn} <location>"
        },
        envGlobal: {
            weatherApiKey: "d7e795ae6a0d44aaa8abb1a0a7ac19e4"
        }
    },

    langs: {
        vi: {
            syntaxError: "Vui lòng nhập địa điểm",
            notFound: "Không thể tìm thấy địa điểm: %1",
            error: "Đã xảy ra lỗi: %1",
            today: "Thời tiết hôm nay: %1\n%2\n🌡 Nhiệt độ thấp nhất - cao nhất %3°C - %4°C\n🌡 Nhiệt độ cảm nhận được %5°C - %6°C\n🌅 Mặt trời mọc %7\n🌄 Mặt trời lặn %8\n🌃 Mặt trăng mọc %9\n🏙 Mặt trăng lặn %10\n🌞 Ban ngày: %11\n🌙 Ban đêm: %12"
        },
        en: {
            syntaxError: "Please enter a location",
            notFound: "Location not found: %1",
            error: "An error has occurred: %1",
            today: "Today's weather: %1\n%2\n🌡 Low - high temperature %3°C - %4°C\n🌡 Feels like %5°C - %6°C\n🌅 Sunrise %7\n🌄 Sunset %8\n🌃 Moonrise %9\n🏙 Moonset %10\n🌞 Day: %11\n🌙 Night: %12"
        }
    },

    onStart: async function ({ args, message, envGlobal, getLang }) {
        
        const bgImagePath = __dirname + "/assets/image/bgWeather.jpg";
        
        if (!fs.existsSync(bgImagePath)) {
            try {
                const bgDir = __dirname + "/assets/image";
                if (!fs.existsSync(bgDir)) {
                    fs.mkdirSync(bgDir, { recursive: true });
                }
                
                
                const imageUrl = "https://i.ibb.co.com/0fLJm40/360-F-347094458-7rx-Tk-Cr-Zzq-Gw-Dy-Qf-Mgb-Zw-Xt-KT4k-YT7-Yg.jpg";
                const response = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'arraybuffer'
                });
                
                fs.writeFileSync(bgImagePath, response.data);
                console.log("✅ Weather background image downloaded successfully!");
            } catch (downloadError) {
                console.error("❌ Failed to download bg image:", downloadError);
                
            }
        }

        const apikey = envGlobal.weatherApiKey;

        const area = args.join(" ");
        if (!area)
            return message.reply(getLang("syntaxError"));
            
        let areaKey, dataWeather, areaName;

        try {
            const response = (await axios.get(`https://api.accuweather.com/locations/v1/cities/search.json?q=${encodeURIComponent(area)}&apikey=${apikey}&language=en`)).data;
            if (response.length == 0)
                return message.reply(getLang("notFound", area));
            const data = response[0];
            areaKey = data.Key;
            areaName = data.LocalizedName;
        }
        catch (err) {
            return message.reply(getLang("error", err.response?.data?.Message || err.message));
        }

        try {
            dataWeather = (await axios.get(`http://api.accuweather.com/forecasts/v1/daily/10day/${areaKey}?apikey=${apikey}&details=true&language=en`)).data;
        }
        catch (err) {
            return message.reply(`❌ An error occurred: ${err.response?.data?.Message || err.message}`);
        }

        const dataWeatherDaily = dataWeather.DailyForecasts;
        const dataWeatherToday = dataWeatherDaily[0];
        const msg = getLang("today", areaName, dataWeather.Headline.Text, convertFtoC(dataWeatherToday.Temperature.Minimum.Value), convertFtoC(dataWeatherToday.Temperature.Maximum.Value), convertFtoC(dataWeatherToday.RealFeelTemperature.Minimum.Value), convertFtoC(dataWeatherToday.RealFeelTemperature.Maximum.Value), formatHours(dataWeatherToday.Sun.Rise), formatHours(dataWeatherToday.Sun.Set), formatHours(dataWeatherToday.Moon.Rise), formatHours(dataWeatherToday.Moon.Set), dataWeatherToday.Day.LongPhrase, dataWeatherToday.Night.LongPhrase);

        
        let canvas, ctx;
        
        if (fs.existsSync(bgImagePath)) {
    
            const bg = await Canvas.loadImage(bgImagePath);
            canvas = Canvas.createCanvas(bg.width, bg.height);
            ctx = canvas.getContext("2d");
            ctx.drawImage(bg, 0, 0, bg.width, bg.height);
        } else {
        
            canvas = Canvas.createCanvas(1000, 600);
            ctx = canvas.getContext("2d");
            
            
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1e3c72');
            gradient.addColorStop(1, '#2a5298');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            for (let i = 0; i < 50; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        let X = 100;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        const data = dataWeather.DailyForecasts.slice(0, 7);
        
        for (const item of data) {
            try {
                const icon = await Canvas.loadImage("http://vortex.accuweather.com/adc2010/images/slate/icons/" + item.Day.Icon + ".svg");
                ctx.drawImage(icon, X, 210, 80, 80);
            } catch (iconError) {
                
            }

            ctx.font = "30px BeVietnamPro-SemiBold";
            const maxC = `${convertFtoC(item.Temperature.Maximum.Value)}°C`;
            ctx.fillText(maxC, X, 366);

            ctx.font = "30px BeVietnamPro-Regular";
            const minC = `${convertFtoC(item.Temperature.Minimum.Value)}°C`;
            const day = moment(item.Date).format("DD");
            ctx.fillText(minC, X, 445);
            ctx.fillText(day, X + 20, 140);

            X += 135;
        }

        const pathSaveImg = `${__dirname}/tmp/weather_${areaKey}.jpg`;
        
    
        const tmpDir = `${__dirname}/tmp`;
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        fs.writeFileSync(pathSaveImg, canvas.toBuffer());

        return message.reply({
            body: msg,
            attachment: fs.createReadStream(pathSaveImg)
        }, () => fs.unlinkSync(pathSaveImg));
    }
};
