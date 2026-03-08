/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 *
 * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 *
 */

process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error));

const axios = require("axios");
const fs = require("fs-extra");
const google = require("googleapis").google;
const nodemailer = require("nodemailer");
const { execSync } = require('child_process');
const log = require('./logger/log.js');
const path = require("path");

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0; // Disable warning: "Warning: a promise was created in a handler but was not returned from it"

function validJSON(pathDir) {
	try {
		if (!fs.existsSync(pathDir))
			throw new Error(`File "${pathDir}" not found`);
		execSync(`npx jsonlint "${pathDir}"`, { stdio: 'pipe' });
		return true;
	}
	catch (err) {
		let msgError = err.message;
		msgError = msgError.split("\n").slice(1).join("\n");
		const indexPos = msgError.indexOf("    at");
		msgError = msgError.slice(0, indexPos != -1 ? indexPos - 1 : msgError.length);
		throw new Error(msgError);
	}
}

const { NODE_ENV } = process.env;
const dirConfig = path.normalize(`${__dirname}/config.json`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands.json`);
// Update account.txt path to appstate folder - now supporting multiple account files
const appstateDir = path.normalize(`${__dirname}/appstate`);

// Create appstate folder if it doesn't exist
if (!fs.existsSync(appstateDir)) {
	fs.mkdirSync(appstateDir, { recursive: true });
}

// Function to check if account file has valid cookie data
function isValidAccountFile(filePath) {
	try {
		if (!fs.existsSync(filePath)) return false;
		const content = fs.readFileSync(filePath, 'utf8');
		if (!content || content.trim() === '') return false;
		
		// Try to parse JSON to validate it's proper cookie data
		const parsed = JSON.parse(content);
		// Check if it's an array with at least one item (basic validation for Facebook appstate)
		return Array.isArray(parsed) && parsed.length > 0;
	} catch (err) {
		return false;
	}
}

// Function to get all valid account files from appstate folder
function getValidAccountFiles() {
	try {
		const files = fs.readdirSync(appstateDir);
		// Filter only .txt files that start with 'account' and have valid content
		const accountFiles = files
			.filter(file => file.startsWith('account') && file.endsWith('.txt'))
			.sort((a, b) => {
				const numA = parseInt(a.match(/\d+/)?.[0] || '0');
				const numB = parseInt(b.match(/\d+/)?.[0] || '0');
				return numA - numB;
			})
			.filter(file => {
				const fullPath = path.normalize(`${appstateDir}/${file}`);
				return isValidAccountFile(fullPath);
			});
		
		return accountFiles;
	} catch (err) {
		log.error("APPSTATE", "Error reading appstate folder:", err);
		return [];
	}
}

// Get all valid account files
const validAccountFiles = getValidAccountFiles();

// Track invalid account files (ones with empty/invalid data)
function getInvalidAccountFiles() {
	try {
		const files = fs.readdirSync(appstateDir);
		return files
			.filter(file => file.startsWith('account') && file.endsWith('.txt'))
			.filter(file => {
				const fullPath = path.normalize(`${appstateDir}/${file}`);
				return !isValidAccountFile(fullPath);
			})
			.map(file => file);
	} catch (err) {
		return [];
	}
}

const invalidAccountFiles = getInvalidAccountFiles();
if (invalidAccountFiles.length > 0) {
	log.warn("APPSTATE", `Found ${invalidAccountFiles.length} invalid/empty account file(s): ${invalidAccountFiles.join(', ')}. These will be skipped.`);
}

// Get the first valid account file
let activeAccountFile = validAccountFiles.length > 0 ? validAccountFiles[0] : null;
let dirAccount = activeAccountFile ? path.normalize(`${appstateDir}/${activeAccountFile}`) : null;

if (!dirAccount) {
	log.error("APPSTATE", "No valid account file found! Please add valid cookie data in account files (account1.txt, account2.txt, etc.) in the appstate folder.");
	process.exit(0);
}

log.info("APPSTATE", `Found ${validAccountFiles.length} valid account file(s): ${validAccountFiles.join(', ')}`);
log.info("APPSTATE", `Using account file: ${activeAccountFile} (${validAccountFiles.indexOf(activeAccountFile) + 1}/${validAccountFiles.length} valid accounts)`);

for (const pathDir of [dirConfig, dirConfigCommands]) {
	try {
		validJSON(pathDir);
	}
	catch (err) {
		log.error("CONFIG", `Invalid JSON file "${pathDir.replace(__dirname, "")}":\n${err.message.split("\n").map(line => `  ${line}`).join("\n")}\nPlease fix it and restart bot`);
		process.exit(0);
	}
}
const config = require(dirConfig);
if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds))
	config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map(id => id.toString());
const configCommands = require(dirConfigCommands);

global.GoatBot = {
	startTime: Date.now() - process.uptime() * 1000, // time start bot (ms)
	commands: new Map(), // store all commands
	eventCommands: new Map(), // store all event commands
	commandFilesPath: [], // [{ filePath: "", commandName: [] }
	eventCommandsFilesPath: [], // [{ filePath: "", commandName: [] }
	aliases: new Map(), // store all aliases
	onFirstChat: [], // store all onFirstChat [{ commandName: "", threadIDsChattedFirstTime: [] }}]
	onChat: [], // store all onChat
	onEvent: [], // store all onEvent
	onReply: new Map(), // store all onReply
	onReaction: new Map(), // store all onReaction
	onAnyEvent: [], // store all onAnyEvent
	config, // store config
	configCommands, // store config commands
	envCommands: {}, // store env commands
	envEvents: {}, // store env events
	envGlobal: {}, // store env global
	reLoginBot: function () { }, // function relogin bot, will be set in bot/login/login.js
	Listening: null, // store current listening handle
	oldListening: [], // store old listening handle
	callbackListenTime: {}, // store callback listen 
	storage5Message: [], // store 5 message to check listening loop
	fcaApi: null, // store fca api
	botID: null, // store bot id
	// Add these for multiple account support
	accountFiles: validAccountFiles, // all valid account files
	currentAccountIndex: 0, // index of current active account
	activeAccountFile: activeAccountFile, // current active account file
	allAccountFiles: {
		valid: validAccountFiles,
		invalid: invalidAccountFiles,
		total: validAccountFiles.length + invalidAccountFiles.length
	}
};

// Function to check if current account is still valid
global.GoatBot.isCurrentAccountValid = function() {
	if (!global.GoatBot.activeAccountFile) return false;
	const accountPath = path.normalize(`${appstateDir}/${global.GoatBot.activeAccountFile}`);
	return isValidAccountFile(accountPath);
};

// Function to switch to next valid account
global.GoatBot.switchToNextAccount = function() {
	// Get fresh list of valid accounts (in case files changed)
	const currentValidAccounts = getValidAccountFiles();
	
	// Update our stored list if it changed
	if (currentValidAccounts.length > 0) {
		global.GoatBot.accountFiles = currentValidAccounts;
	}
	
	// Try next account in the list
	const nextIndex = global.GoatBot.currentAccountIndex + 1;
	if (nextIndex < global.GoatBot.accountFiles.length) {
		global.GoatBot.currentAccountIndex = nextIndex;
		global.GoatBot.activeAccountFile = global.GoatBot.accountFiles[nextIndex];
		global.client.dirAccount = path.normalize(`${appstateDir}/${global.GoatBot.activeAccountFile}`);
		log.warn("APPSTATE", `Switching to next account: ${global.GoatBot.activeAccountFile} (${nextIndex + 1}/${global.GoatBot.accountFiles.length})`);
		return true;
	} 
	// If we've tried all accounts, loop back to first and check if any new valid accounts appeared
	else {
		// Try to find any valid accounts again (maybe some new ones were added)
		const freshValidAccounts = getValidAccountFiles();
		if (freshValidAccounts.length > 0) {
			// If we have different accounts now, start from first
			if (JSON.stringify(freshValidAccounts) !== JSON.stringify(global.GoatBot.accountFiles)) {
				global.GoatBot.accountFiles = freshValidAccounts;
				global.GoatBot.currentAccountIndex = 0;
				global.GoatBot.activeAccountFile = freshValidAccounts[0];
				global.client.dirAccount = path.normalize(`${appstateDir}/${global.GoatBot.activeAccountFile}`);
				log.warn("APPSTATE", `Found new valid accounts, switching to: ${global.GoatBot.activeAccountFile}`);
				return true;
			}
			// If same accounts, try first one again (maybe it's working now)
			else {
				global.GoatBot.currentAccountIndex = 0;
				global.GoatBot.activeAccountFile = global.GoatBot.accountFiles[0];
				global.client.dirAccount = path.normalize(`${appstateDir}/${global.GoatBot.activeAccountFile}`);
				log.warn("APPSTATE", `All accounts tried, looping back to first: ${global.GoatBot.activeAccountFile}`);
				return true;
			}
		}
		log.error("APPSTATE", "No valid accounts available to try!");
		return false;
	}
};

// Function to get account status summary
global.GoatBot.getAccountStatus = function() {
	const valid = global.GoatBot.allAccountFiles.valid;
	const invalid = global.GoatBot.allAccountFiles.invalid;
	return {
		current: global.GoatBot.activeAccountFile,
		currentIndex: global.GoatBot.currentAccountIndex + 1,
		totalValid: valid.length,
		totalInvalid: invalid.length,
		validAccounts: valid,
		invalidAccounts: invalid
	};
};

global.db = {
	// all data
	allThreadData: [],
	allUserData: [],
	allDashBoardData: [],
	allGlobalData: [],

	// model
	threadModel: null,
	userModel: null,
	dashboardModel: null,
	globalModel: null,

	// handle data
	threadsData: null,
	usersData: null,
	dashBoardData: null,
	globalData: null,

	receivedTheFirstMessage: {}

	// all will be set in bot/login/loadData.js
};

global.client = {
	dirConfig,
	dirConfigCommands,
	dirAccount, // This will be updated when switching accounts
	countDown: {},
	cache: {},
	database: {
		creatingThreadData: [],
		creatingUserData: [],
		creatingDashBoardData: [],
		creatingGlobalData: []
	},
	commandBanned: configCommands.commandBanned
};

const utils = require("./utils.js");
global.utils = utils;
const { colors } = utils;

global.temp = {
	createThreadData: [],
	createUserData: [],
	createThreadDataError: [], // Can't get info of groups with instagram members
	filesOfGoogleDrive: {
		arraybuffer: {},
		stream: {},
		fileNames: {}
	},
	contentScripts: {
		cmds: {},
		events: {}
	}
};

// watch dirConfigCommands file and dirConfig
const watchAndReloadConfig = (dir, type, prop, logName) => {
	let lastModified = fs.statSync(dir).mtimeMs;
	let isFirstModified = true;

	fs.watch(dir, (eventType) => {
		if (eventType === type) {
			const oldConfig = global.GoatBot[prop];

			// wait 200ms to reload config
			setTimeout(() => {
				try {
					// if file change first time (when start bot, maybe you know it's called when start bot?) => not reload
					if (isFirstModified) {
						isFirstModified = false;
						return;
					}
					// if file not change => not reload
					if (lastModified === fs.statSync(dir).mtimeMs) {
						return;
					}
					global.GoatBot[prop] = JSON.parse(fs.readFileSync(dir, 'utf-8'));
					log.success(logName, `Reloaded ${dir.replace(process.cwd(), "")}`);
				}
				catch (err) {
					log.warn(logName, `Can't reload ${dir.replace(process.cwd(), "")}`);
					global.GoatBot[prop] = oldConfig;
				}
				finally {
					lastModified = fs.statSync(dir).mtimeMs;
				}
			}, 200);
		}
	});
};

watchAndReloadConfig(dirConfigCommands, 'change', 'configCommands', 'CONFIG COMMANDS');
watchAndReloadConfig(dirConfig, 'change', 'config', 'CONFIG');

global.GoatBot.envGlobal = global.GoatBot.configCommands.envGlobal;
global.GoatBot.envCommands = global.GoatBot.configCommands.envCommands;
global.GoatBot.envEvents = global.GoatBot.configCommands.envEvents;

// ———————————————— LOAD LANGUAGE ———————————————— //
const getText = global.utils.getText;

// ———————————————— AUTO RESTART ———————————————— //
if (config.autoRestart) {
	const time = config.autoRestart.time;
	if (!isNaN(time) && time > 0) {
		utils.log.info("AUTO RESTART", getText("Goat", "autoRestart1", utils.convertTime(time, true)));
		setTimeout(() => {
			utils.log.info("AUTO RESTART", "Restarting...");
			process.exit(2);
		}, time);
	}
	else if (typeof time == "string" && time.match(/^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})$/gmi)) {
		utils.log.info("AUTO RESTART", getText("Goat", "autoRestart2", time));
		const cron = require("node-cron");
		cron.schedule(time, () => {
			utils.log.info("AUTO RESTART", "Restarting...");
			process.exit(2);
		});
	}
}

(async () => {
	// ———————————————— SETUP MAIL ———————————————— //
	const { gmailAccount } = config.credentials;
	const { email, clientId, clientSecret, refreshToken } = gmailAccount;
	const OAuth2 = google.auth.OAuth2;
	const OAuth2_client = new OAuth2(clientId, clientSecret);
	OAuth2_client.setCredentials({ refresh_token: refreshToken });
	let accessToken;
	try {
		accessToken = await OAuth2_client.getAccessToken();
	}
	catch (err) {
		throw new Error(getText("Goat", "googleApiTokenExpired"));
	}
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		service: 'Gmail',
		auth: {
			type: 'OAuth2',
			user: email,
			clientId,
			clientSecret,
			refreshToken,
			accessToken
		}
	});

	async function sendMail({ to, subject, text, html, attachments }) {
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			service: 'Gmail',
			auth: {
				type: 'OAuth2',
				user: email,
				clientId,
				clientSecret,
				refreshToken,
				accessToken
			}
		});
		const mailOptions = {
			from: email,
			to,
			subject,
			text,
			html,
			attachments
		};
		const info = await transporter.sendMail(mailOptions);
		return info;
	}

	global.utils.sendMail = sendMail;
	global.utils.transporter = transporter;

	// ———————————————— CHECK VERSION ———————————————— //
	const { data: { version } } = await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/package.json");
	const currentVersion = require("./package.json").version;
	if (compareVersion(version, currentVersion) === 1)
		utils.log.master("NEW VERSION", getText(
			"Goat",
			"newVersionDetected",
			colors.gray(currentVersion),
			colors.hex("#eb6a07", version),
			colors.hex("#eb6a07", "node update")
		));
	// —————————— CHECK FOLDER GOOGLE DRIVE —————————— //
	const parentIdGoogleDrive = await utils.drive.checkAndCreateParentFolder("GoatBot");
	utils.drive.parentID = parentIdGoogleDrive;
	// ———————————————————— LOGIN ———————————————————— //
	require(`./bot/login/login${NODE_ENV === 'development' ? '.dev.js' : '.js'}`);
})();

function compareVersion(version1, version2) {
	const v1 = version1.split(".");
	const v2 = version2.split(".");
	for (let i = 0; i < 3; i++) {
		if (parseInt(v1[i]) > parseInt(v2[i]))
			return 1; // version1 > version2
		if (parseInt(v1[i]) < parseInt(v2[i]))
			return -1; // version1 < version2
	}
	return 0; // version1 = version2
}
