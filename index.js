const Discord = require('discord.js');
const {config} = require('dotenv');
const fs = require('fs');

const request = require("request");
const latinise = require('./latinise'); //ty cheron and company

const client = new Discord.Client({disableEveryone: true});

config({
	path: __dirname + "/.env"
})

// For placements
String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

const enableTop50 = false;

const activityForTop50 = 86400*1000*7; // in milliseconds

var rtRoles = [], ctRoles = [], rtRanges = [], ctRanges = [];
var rtLRRoles = [], ctLRRoles = [], rtLRRanges = [], ctLRRanges = [];

var finalTop50Str = "";

// champion stuff
var championRole = true;
var allPlayersInAnEvent = [];

const downloadPage = (url) => {
    return new Promise((resolve, reject) => {
        request({url: url, timeout: 5000}, (error, response, body) => {
            if (error) reject(error);
            if (!response) return "do over";
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
                console.log("LOL LOSER");
            }
            resolve(body);
        })
    })
}

async function populateRoleRangesB(url, arr1, arr2, mode, classMode) {
	try {
		let html = await downloadPage(url);
		let parsedData = JSON.parse(html);
		if (parsedData.status != "success") return false;
		parsedData = parsedData.results;
		for (let i = 0; i < parsedData.length; i++) {
			arr1[Number(parsedData[i].ladder_order)-1] = mode + " " + (classMode ? parsedData[i].ladder_class_name : parsedData[i].ladder_boundary_name);
			if (i != 0) arr2[Number(parsedData[i].ladder_order)-2] = classMode ? Number(parsedData[i].minimum_mmr) : Number(parsedData[i].minimum_lr);
		}
	} catch (error) {
		console.error('ERROR:');
        console.error(error);
	}

}

function populateRolesRanges() {
	rtRoles = [], ctRoles = [], rtRanges = [], ctRanges = [];
	rtLRRoles = [], ctLRRoles = [], rtLRRanges = [], ctLRRanges = [];
	if (!populateRoleRangesB("https://mkwlounge.gg/api/ladderclass.php?ladder_type=rt", rtRoles, rtRanges, "RT", true)) return false;
	if (!populateRoleRangesB("https://mkwlounge.gg/api/ladderboundary.php?ladder_type=rt", rtLRRoles, rtLRRanges, "RT", false)) return false;
	if (!populateRoleRangesB("https://mkwlounge.gg/api/ladderclass.php?ladder_type=ct", ctRoles, ctRanges, "CT", true)) return false;
	if (!populateRoleRangesB("https://mkwlounge.gg/api/ladderboundary.php?ladder_type=ct", ctLRRoles, ctLRRanges, "CT", false)) return false;
	return true;
}

const determineLatestEvent = async (mode) => {
	try {
		let num = mode == 'rt' ? '1' : '2';
		let html = await downloadPage('https://mkwlounge.gg/api/ladderevent.php?ladder_type=' + mode + '&all=1&compress');
		let parsedData = JSON.parse(html);
		if (parsedData.status != "success") return false;
		parsedData = parsedData.results;
		if (parsedData.length > 0)
			return parsedData[0].event_id.toString();
		else
			return false;
	} catch (error) {
		console.error('ERROR:');
        console.error(error);
	}
}

const tran_str = (inp) => {
	if (inp === undefined) return undefined;
	return inp.replace(/\s/g, '').latinise().toLowerCase();
}

const emoji = (inp, msg_o) => {
	try {
		if (inp === 'ron') inp = 'Iron';
		let theEmoji = msg_o.guild.emojis.cache.find(emoji => emoji.name == inp);
		//console.log("<:" + inp + ":" + theEmoji.id.toString() + ">");
		return ("<:" + inp + ":" + theEmoji.id.toString() + ">");
	} catch (error) {
		console.error("ERROR:");
		console.error(error);
	}
}

async function getCurrentLoungeDate() {
	try {
		let currentDate = await downloadPage("https://mkwlounge.gg/api/serverstats.php");
		currentDate = JSON.parse(currentDate);
		currentDate = currentDate.results;
		return new Date(currentDate.server_timestamp);
	} catch(error) {
		console.log(error);
	}
}

const getRequest = async (mode, warid, msg_obj) => {
	var roles = [], members = [], lrRoles = [], lrMembers = [];
	try {
		const checkRoles = mode == 'rt' ? rtRoles : ctRoles;
		const LRCheckRoles = mode == 'rt' ? rtLRRoles : ctLRRoles;
		var num = mode == 'rt' ? '1' : '2';
		if (enableTop50) {
			let top50names = [];
			let top50html = await downloadPage(`https://mkwlounge.gg/api/ladderplayer.php?ladder_type=${mode}&all=1&compress`);
			let top50json = JSON.parse(top50html);
			top50json = top50json.results;
			let top50OnPage = [];
			let currentDate = await getCurrentLoungeDate();
			if (!currentDate) currentDate = new Date();
			for (let i = 0, counter = 0; i < 150; i++) {
				let compareDate = new Date(top50json[i].last_event_date);
				if (currentDate - compareDate > activityForTop50) {
					continue;
				}
				counter++;
				top50OnPage.push(tran_str(top50json[i].player_name));
				if (counter >= 50) break;
			}
			let currentPlayerCollection = await msg_obj.guild.members.cache.filter(member => member.roles.cache.some(role => role.id == (mode == 'rt' ? '800958350446690304' : '800958359569694741')));
			await currentPlayerCollection.each(member => top50names.push(tran_str(member.displayName)));
			// remove the role from the people that have it and don't meet requirements
			for (let i = 0; i < top50names.length; i++) {
				if (!top50OnPage.includes(top50names[i])) {
					let currentPlayer = await msg_obj.guild.members.cache.find(member => tran_str(member.displayName) == top50names[i] && member.roles.cache.some(role => checkRoles.includes(role.name)) && !member.roles.cache.some(role => role.name === "Unverified"));
					if (currentPlayer != undefined && enableTop50) await currentPlayer.roles.remove(mode == "rt" ? '800958350446690304' : '800958359569694741');
				}
			}
			// add role only to those who don't have it already
			for (let i = 0; i < top50OnPage.length; i++) {
				if (!top50names.includes(top50OnPage[i])) {
					let currentPlayer = await msg_obj.guild.members.cache.find(member => tran_str(member.displayName) == top50OnPage[i] && member.roles.cache.some(role => checkRoles.includes(role.name)) && !member.roles.cache.some(role => role.name === "Unverified"));
					if (currentPlayer != undefined && enableTop50) {
						await currentPlayer.roles.add(mode == "rt" ? '800958350446690304' : '800958359569694741');
						finalTop50Str += `\n<@${currentPlayer.id}> <:top:795155129375522876>`;
					}
				}
			}
		}

		const currentRange = mode == 'rt' ? rtRanges : ctRanges;
		const LRCurrentRange = mode == 'rt' ? rtLRRanges : ctLRRanges;
		if (isNaN(warid)) {
			let html = await downloadPage('https://mkwlounge.gg/api/ladderplayer.php?ladder_type=' + mode + '&player_name=' + warid);
			let parsedData = JSON.parse(html);
			if (parsedData.status != "success") return false;
			parsedData = parsedData.results;
			let returnArray = [];
			let LRReturnArray = [];
			if (parsedData.length > 0) {
				for (let i = 0; i < parsedData.length; i++) {
					returnArray.push(parsedData[i].discord_user_id);
					LRReturnArray.push(parsedData[i].discord_user_id);
					let currentMMR = Number(parsedData[i].current_mmr);
					let currentLR = Number(parsedData[i].current_lr);
					for (let j = 0; j < checkRoles.length; j++) {
						if (j == 0) {
							if (currentMMR < currentRange[j]) returnArray.push(checkRoles[j]);
						} else if (j == checkRoles.length-1) {
							if (currentMMR >= currentRange[j-1]) returnArray.push(checkRoles[j]);
						} else {
							if (currentMMR >= currentRange[j-1] && currentMMR < currentRange[j]) returnArray.push(checkRoles[j]);
						}
					}
					for (let j = 0; j < LRCheckRoles.length; j++) {
						if (j == 0) {
							if (currentLR < LRCurrentRange[j]) LRReturnArray.push(LRCheckRoles[j]);
						} else if (j == LRCheckRoles.length-1) {
							if (currentLR >= LRCurrentRange[j-1]) LRReturnArray.push(LRCheckRoles[j]);
						} else {
							if (currentLR >= LRCurrentRange[j-1] && currentLR < LRCurrentRange[j]) LRReturnArray.push(LRCheckRoles[j]);
						}
					}
				}
			} else
				return false;
			return [returnArray, LRReturnArray];
		} else {
			let html = await downloadPage('https://mkwlounge.gg/api/ladderevent.php?ladder_type=' + mode + '&event_id=' + warid + "&compress");
			let parsedData = JSON.parse(html);
			parsedData = parsedData.results;
			let lrOrder = [], mmrOrder = [];
			if (parsedData.length > 1) {
				for (let i = 0; i < parsedData.length; i++) {
					let promotion = parsedData[i].promotion;
					let currentMr = parsedData[i].current_mmr;
					let updatedMr = parsedData[i].updated_mmr;
					let currentLr = parsedData[i].current_lr;
					let updatedLr = parsedData[i].updated_lr;
					allPlayersInAnEvent.push(parsedData[i].discord_user_id);

					for (let j = 0; j < currentRange.length; j++) {
						if (currentMr >= currentRange[j] && updatedMr < currentRange[j]) {
							members.push(parsedData[i].discord_user_id);
							roles.push(checkRoles[j]);
							mmrOrder.push(i);
							continue;
						}
						if (currentMr < currentRange[j] && updatedMr >= currentRange[j]) {
							members.push(parsedData[i].discord_user_id);
							roles.push(checkRoles[j+1]);
							mmrOrder.push(i);
							continue;
						}
					}

					for (let j = 0; j < LRCurrentRange.length; j++) {
						if (currentLr >= LRCurrentRange[j] && updatedLr < LRCurrentRange[j]) {
							lrMembers.push(parsedData[i].discord_user_id);
							lrRoles.push(LRCheckRoles[j]);
							lrOrder.push(i);
							continue;
						}
						if (currentLr < LRCurrentRange[j] && updatedLr >= LRCurrentRange[j]) {
							lrMembers.push(parsedData[i].discord_user_id);
							lrRoles.push(LRCheckRoles[j+1]);
							lrOrder.push(i);
							continue;
						}
					}

					// OLD METHOD
					// if (promotion.includes("Demoted")) {
					// 	members.push(parsedData[i].name)
					// 	roles.push(mode.toUpperCase() + " " + promotion.replace("Demoted ", ''))
					// } else if (promotion.includes("Promoted")) {
					// 	members.push(parsedData[i].name)
					// 	roles.push(mode.toUpperCase() + " " + promotion.replace("Promoted ", ''))
					// }
				}
			} else
				return false;
			let combinedroles = roles.join(",");
			let combinedmembers = members.join(",");
			let combinedlrroles = lrRoles.join(",");
			let combinedlrmembers = lrMembers.join(",");

			return [(combinedroles + "," + combinedmembers),(combinedlrroles + "," + combinedlrmembers),mmrOrder,lrOrder];
		}
	} catch (error) {
		console.error('ERROR:');
        console.error(error);
        if (error.code == "ETIMEDOUT") {
        	msg_obj.channel.send("A connection error occurred. Please try again");
        }
	}
}

const send_dm = (msg_o, mes) => {
	return msg_o.author.send(mes).catch((e) => console.log("Unable to send messsages to " + msg_o.author.tag + ", who attempted to use this bot"));
}

const checkForDuplicateRoles = (rolesArr, player) => {
	let roleCount = 0;
	rolesArr.forEach((roleVal) => {
		if (player.roles.cache.some(role => role.name === roleVal)) {
			roleCount++;
		}
	})
	if (roleCount > 1)
		return true;
	else
		return false;
}

const findDuplicatePlayers = (arra1) => {
    let object = {};
    let result = [];
    arra1.forEach(function (item) {
    	if(!object[item])
        	object[item] = 0;
        object[item] += 1;
    })
    for (var prop in object) {
    	if(object[prop] >= 2) {
        	result.push(prop);
    	}
    }
    return result;
}

const removeDuplicates = (array) => {
  let x = {};
  array.forEach(function(i) {
  	if(!x[i]) {
    	x[i] = true;
    }
  })
  return Object.keys(x);
};


const doTop50Stuff = async (msg_obj, mode) => {
	try {
		if (enableTop50) {
			var num = mode == 'rt' ? '1' : '2';
			let ldbPage = await downloadPage(`https://mkwlounge.gg/api/ladderplayer.php?ladder_type=${mode}&all=1&compress`);
			ldbPage = JSON.parse(ldbPage);
			ldbPage = ldbPage.results;
			let playerswithTop50 = [];
			let playerswithTop50Col = msg_obj.guild.members.cache.filter(member => member.roles.cache.some(role => role.id == (mode == 'rt' ? '800958350446690304' : '800958359569694741')));
			if (playerswithTop50Col != undefined)
				playerswithTop50Col.each(member => playerswithTop50.push(member.id));
			let currentDate = await getCurrentLoungeDate();
			if (!currentDate) currentDate = new Date();
			for (let i = 0, counter = 0; i < ldbPage.length; i++) {
				counter++;
				let currentPlayerCollection = await msg_obj.guild.members.cache.filter(member => tran_str(member.displayName) == tran_str(ldbPage[i].player_name) && !member.roles.cache.some(role => role.name == "Unverified") && member.roles.cache.some(role => (mode == 'rt' ? rtRoles.includes(role.name) : ctRoles.includes(role.name))));
				let somePlayerArr = [], currentPlayer;
				currentPlayerCollection.each(member => somePlayerArr.push(member.id));
				if (somePlayerArr.length > 1) {
					let somestr = '';
					for (j = 0; j < somePlayerArr.length; j++) {
						somestr += (j != 0 ? " & " : "") + "<@" + somePlayerArr[j] + ">";
					}
					msg_obj.channel.send(somestr + " have the same display name. <@" + somePlayerArr[0] + "> is being considered for the role");

				}
				if (somePlayerArr.length == 0) {
					msg_obj.channel.send("Unable to find server member with the name " + ldbPage[i].player_name + ", who should have " + mode.toUpperCase() + " Top 50");
					continue;
				}
				currentPlayer = msg_obj.guild.member(somePlayerArr[0]);
				if (currentPlayer != undefined) {
					let compareDate = new Date(ldbPage[i].last_event_date);
					if (currentDate - compareDate > activityForTop50) {
						counter--;
						await currentPlayer.roles.remove(mode == 'rt' ? '800958350446690304' : '800958359569694741');
						await msg_obj.channel.send(`${currentPlayer.user.tag} has been demoted from ${mode.toUpperCase()} <:top:795155129375522876> due to inactivity`);
						continue;
					}
					if (!currentPlayer.roles.cache.some(role => role.name == (mode == 'rt' ? '800958350446690304' : '800958359569694741'))) {
						await currentPlayer.roles.add(mode == 'rt' ? '800958350446690304' : '800958359569694741');
						await msg_obj.channel.send(`${currentPlayer.user.tag} has been promoted to ${mode.toUpperCase()} <:top:795155129375522876>`);
					} else {
						await msg_obj.channel.send(`${currentPlayer.user.tag} has maintained ${mode.toUpperCase()} <:top:795155129375522876>`);
					}
					let lolIndex = playerswithTop50.indexOf(currentPlayer.id);
					if (lolIndex != undefined)
						playerswithTop50.splice(lolIndex, 1);
				}
				if (counter >= 50) break;
			}
			for (i = 0; i < playerswithTop50.length; i++) {
				let currentPlayer = msg_obj.guild.member(playerswithTop50[i]);
				if (currentPlayer != undefined) {
					await currentPlayer.roles.remove(mode == 'rt' ? '800958350446690304' : '800958359569694741');
					msg_obj.channel.send(`${currentPlayer.user.tag} has been demoted from ${mode.toUpperCase()} <:top:795155129375522876>`);
				}
			}
		}
	} catch(error) {
		console.log(error);
	}
}


client.on('message', async msg => {
	try {
		//<:top:801111279157641246>
		//msg.channel.send(emoji('top', msg));
		allPlayersInAnEvent = [];
		finalTop50Str = "";
		var contentForRankings = msg.content;
		msg.content = msg.content.replace(/<(.*?)>/i, '');
		msg.content = msg.content.toLowerCase();
		while(msg.content[0]==' ')msg.content = msg.content.slice(1);
		// let hahaha = await downloadPage("https://mariokartboards.com/lounge/json/player.php?type=rt&name=Fox,kenchan,Killua,neuro,Shaun,Jeff,Kaspie,barney,meraki,pachu,Quinn,Leops,Mikey,jun,Sane,rusoX,Az,EmilP,Batcake,Taz,Sora,Dane,lo,Solar,Goober");
		// hahaha = JSON.parse(hahaha);
		// console.log(hahaha);
		const commandList = ["!rt", "!ct", "!dp", "!top50", "!assign", "!viewrankings", "!viewlrrankings", "!updaterankings"];
		let go_on = false;
		for (command in commandList) {
			if (msg.content.toLowerCase().split(/\s+/)[0] == commandList[command]) go_on = true;
		}
		if (!go_on) return;

		var combinedForDP = [];
		for (i = 0; i < rtRoles.length; i++) {
			combinedForDP.push(rtRoles[i]);
		}
		for (i = 0; i < ctRoles.length; i++) {
			combinedForDP.push(ctRoles[i]);
		}

		const rolesThatCanUpdate = ['387347888935534593', '792805904047276032', '399382503825211393', '399384750923579392', '521149807994208295', '792891432301625364', '521154917675827221', '393600567781621761', '520808645252874240', '389203448626806785'];
		// 504795505583456257
		let canUpdate = false;
		let canUpdateRankings = false;
		for (i = 0; i < rolesThatCanUpdate.length; i++) {
			if (msg.member.roles.cache.some(role => role.id == rolesThatCanUpdate[i]) && i <= 5) canUpdateRankings = true;
			if (msg.member.roles.cache.some(role => role.id == rolesThatCanUpdate[i])) canUpdate = true;
		}
		if (!canUpdate && !(msg.member.id == '222356623392243712')) {
			// msg.reply("You do not have permissions to use this")
			return;
		}
		if (msg.content.startsWith("!dp")) {
			let memberList = [];
			msg.guild.members.cache.each(member => memberList.push(member.displayName));
			for (i = 0; i < memberList.length; i++) {
				let serverMember = msg.guild.members.cache.find(member => member.displayName === memberList[i]);
				let hasValidRole = false;
				for (j = 0; j < combinedForDP.length; j++) {
					if (serverMember.roles.cache.some(role => role.name === combinedForDP[j]))
						hasValidRole = true;
				}
				memberList[i] = tran_str(memberList[i]);
				if (!hasValidRole) {
					memberList.splice(i, 1);
					i--;
				}
			}
			let duplicateValues = findDuplicatePlayers(memberList);
			let listStr = duplicateValues.length !== 0 ? duplicateValues.join(", ") : "None";
			return msg.channel.send("Players with similar display names in this server: " + listStr);
		}
		if (msg.content.startsWith("!top50")) {
			doTop50Stuff(msg, 'rt');
			doTop50Stuff(msg, 'ct');
			return;
		}

		if (msg.content.startsWith("!viewrankings")) {
			try {
				let updaterankmsg = "";
				for (let i = 0; i < rtRoles.length; i++) {
					updaterankmsg += rtRoles[i] + " —> " + (i == 0 ? "<" : "") + (i == 0 ? rtRanges[i] : rtRanges[i-1]) + (i == 0 ? "" : i == rtRoles.length-1 ? "+" : " - " + (Number(rtRanges[i])-1).toString()) + " MMR\n";
				}
				for (let i = 0; i < ctRoles.length; i++) {
					updaterankmsg += ctRoles[i] + " —> " + (i == 0 ? "<" : "") + (i == 0 ? ctRanges[i] : ctRanges[i-1]) + (i == 0 ? "" : i == ctRoles.length-1 ? "+" : " - " + (Number(ctRanges[i])-1).toString()) + " MMR\n";
				}
				return msg.channel.send(updaterankmsg);
			} catch (error) {
				return msg.channel.send("There are no rankings to view");
			}
		}

		if (msg.content.startsWith("!viewlrrankings")) {
			try {
				let updaterankmsg = "";
				for (let i = 0; i < rtLRRoles.length; i++) {
					updaterankmsg += rtLRRoles[i] + " —> " + (i == 0 ? "<" : "") + (i == 0 ? rtLRRanges[i] : rtLRRanges[i-1]) + (i == 0 ? "" : i == rtLRRoles.length-1 ? "+" : " - " + (Number(rtLRRanges[i])-1).toString()) + " LR\n";
				}
				for (let i = 0; i < ctLRRoles.length; i++) {
					updaterankmsg += ctLRRoles[i] + " —> " + (i == 0 ? "<" : "") + (i == 0 ? ctLRRanges[i] : ctLRRanges[i-1]) + (i == 0 ? "" : i == ctLRRoles.length-1 ? "+" : " - " + (Number(ctLRRanges[i])-1).toString()) + " LR\n";
				}
				return msg.channel.send(updaterankmsg);
			} catch (error) {
				return msg.channel.send("There are no rankings to view");
			}
		}

		if (msg.content.startsWith("!updaterankings")) {
			if (!populateRolesRanges()) msg.channel.send("Connection error updating rankings. Please try again");
			else msg.channel.send("Class rankings and divisions updated");
			return;
		}

		const commandParams = msg.content.split(/\s+/);
		msg.delete();

		if (commandParams[0] == "!assign") {
			if (commandParams.length < 3) return msg.channel.send("One or more arguments missing");
			let currentPlayer;
			if (!msg.mentions.members.first()) {
				currentPlayer = await msg.guild.members.cache.find(member => member.roles.cache.some(role => role.id == (commandParams[2].startsWith("rt") ? '723753340063842345' : '723753312331104317')) && tran_str(member.displayName) == tran_str(commandParams[1]));
			} else currentPlayer = msg.mentions.members.first();
			if (currentPlayer == undefined) {
				msg.channel.send("Unable to find server member with a placement role with the name " + commandParams[1]);
				return;
			}
			let roleName = "";
			for (let i = 2;;i++) {
				if (commandParams[i] != undefined) roleName += commandParams[i];
				else break;
			}
			let outMsg = `<@${currentPlayer.id}> `;
			let roles = roleName.split(",");
			for (let i = 0; i < roles.length; i++) {
				let placeEmoji = i == 0 ? emoji(roles[i].substring(2).capitalize(), msg) : false;
				let serverRole = await msg.guild.roles.cache.find(role => tran_str(role.name) == tran_str(roles[i]));
				if (serverRole == undefined) return msg.channel.send("Unable to find server role with the name " + roles[i]);
				outMsg += (placeEmoji ? placeEmoji : serverRole.name) + (i == roles.length-1 ? "" : i == roles.length-2 ? " & " : ", ");
				await currentPlayer.roles.add(serverRole.id);
			}
			outMsg += " Placement" + (roles.length == 1 ? "" : "s");
			await currentPlayer.roles.remove(commandParams[2].startsWith("rt") ? '723753340063842345' : '723753312331104317');
			return msg.channel.send(outMsg);
		}

		// START

		const modes = commandParams[0].split("!");
		const globalMode = modes[1];

		var partCommandParam = commandParams[1];
		if (commandParams[1] === undefined || commandParams[1] === "")
			partCommandParam = await determineLatestEvent(globalMode);
		if (!partCommandParam) return msg.channel.send("Error. Unable to retrieve latest war id");

		const specialRoles = ["Boss", "Custom Track Arbitrator", "Lower Tier CT Arbitrator", "Higher Tier CT Arbitrator", "LT RT Reporter", "LT CT Reporter", "Lower Tier RT Arbitrator", "Higher Tier RT Arbitrator", "Developer"];
		const modeRoles = (globalMode === "rt") ? rtRoles : ctRoles;
		const LRModeRoles = (globalMode === "rt") ? rtLRRoles : ctLRRoles;

		if (commandParams.length > 2) {
			for (i = 0; i < commandParams.length; i++) {
				if (isNaN(commandParams[1])) {
					if (!isNaN(commandParams[i])) {
						return msg.reply("There are differing value types in your arguments");
					}
				} else {
					if (isNaN(commandParams[i])) {
						return msg.reply("There are differing value types in your arguments");
					}
				}
			}
		}
		let result = await getRequest(globalMode, partCommandParam, msg);
		if (!result && !isNaN(partCommandParam)) return msg.channel.send("Error. Unable to find player/event with the name/id " + partCommandParam);
		var mentionPlayers = '';
		var mentionPlayersArr = [];
		let resultParamsArray = [];
		populateRolesRanges();

		if (isNaN(partCommandParam)) {
			for (i = 0; i < commandParams.length; i++) {
				if (i !== 0 && commandParams[i] !== "np") {
					resultParamsArray.push(commandParams[i]);
				}
			}
			result = await getRequest(globalMode, resultParamsArray.join(","), msg);
			if (!result) return msg.channel.send("Unable to find players with the name(s) " + resultParamsArray.join(","));
			for (i = 0; i < commandParams.length; i++) {
				let checking = true;
				for (j = 0; j < result[0].length; j++) {
					if (tran_str(commandParams[i]) === tran_str(result[0][j]))
						checking = false;
				}
				if (checking && i !== 0 && commandParams[i] !== "np")
					msg.channel.send("Unable to find server member with the name " + commandParams[i]);
			}
			for (i = 0; i < result[0].length; i++) {
				if (i % 2 === 0) {
					//extra logic for additional players
					let currentPlayer = await msg.guild.members.cache.find(member => tran_str(member.id) === tran_str(result[0][i]));
					let serverRole = await msg.guild.roles.cache.find(role => role.name == result[0][i+1]);
					if (!currentPlayer.roles.cache.some(role => role.name.toLowerCase() === serverRole.name.toLowerCase())) {
						for (j = 0; j < modeRoles.length; j++) {
							let hasRole = await currentPlayer.roles.cache.some(role => role.name == modeRoles[j]);
							if (hasRole)
								await currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === modeRoles[j].toLowerCase()));
						}
						let fromPenText = (commandParams[i+2] === "np") ? "" : "(from pen)";
						await currentPlayer.roles.add(serverRole.id);
						mentionPlayers += `<@${currentPlayer.id}> ${result[0][i+1]}`;
						//mentionPlayers += `<@${currentPlayer.id}> ` + emoji(result[i+1].replace(/\s/g, '').replace(/[I]/g, '').replace("RT", '').replace('CT', ''), msg);
						mentionPlayers += result[0][i+1].includes("II") ? " II" : result[0][i+1].includes("I") && !result[0][i+1].includes("Iron") ? " I" : "";
						mentionPlayers += ` ${fromPenText}\n`;
					}
					if (hasDupRoles)
						msg.channel.send(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles but should be ${serverRole.name}. Check if they promoted/demoted to a temprole`);
				}
			}

			for (i = 0; i < result[1].length; i++) {
				if (i % 2 === 0) {
					//extra logic for additional players
					let currentPlayer = await msg.guild.members.cache.find(member => tran_str(member.id) === tran_str(result[1][i]));
					let serverRole = await msg.guild.roles.cache.find(role => role.name == result[1][i+1]);
					if (!currentPlayer.roles.cache.some(role => role.name.toLowerCase() === serverRole.name.toLowerCase())) {
						for (j = 0; j < LRModeRoles.length; j++) {
							if (currentPlayer.roles.cache.some(role => role.name == LRModeRoles[j]))
								await currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === LRModeRoles[j].toLowerCase()));
						}
						let fromPenText = (commandParams[i+2] === "np") ? "" : "(from pen)";
						await currentPlayer.roles.add(serverRole.id);
						mentionPlayers += `<@${currentPlayer.id}> ` + emoji(result[1][i+1].replace(/[I]/g, '').replace("RT ", '').replace('CT ', ''), msg);
						//mentionPlayers += `<@${currentPlayer.id}> ` + emoji(result[i+1].replace(/\s/g, '').replace(/[I]/g, '').replace("RT", '').replace('CT', ''), msg);
						mentionPlayers += result[1][i+1].includes("II") ? " II" : result[1][i+1].includes("I") && !result[1][i+1].includes("Iron") ? " I" : "";
						mentionPlayers += ` ${fromPenText}\n`;
					}
					if (checkForDuplicateRoles(modeRoles, currentPlayer))
						msg.channel.send(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles but should be ${serverRole.name}. Check if they promoted/demoted to a temprole`);
				}
			}
		} else {
			if (commandParams.length > 2) return msg.channel.send("Error. Cannot do multiple events at a time");
			if (result[0] !== ',') {
				let resultarray = result[0].split(",");
				const ranks = resultarray.slice(0, resultarray.length/2);
				const players = resultarray.slice(resultarray.length/2, resultarray.length);
				for (i = 0; i < players.length; i++) {
					let hasSpecialRole = false;
					let currentPlayer = await msg.guild.members.cache.find(member => tran_str(member.id) === tran_str(players[i])/* || member.id === '222356623392243712'*/);
					if (currentPlayer === undefined) {
						msg.channel.send("Player with id " + players[i] + " not found.");
						continue;
					}
					let hasDupRoles = checkForDuplicateRoles(modeRoles, currentPlayer);
					//...
					mentionPlayersArr[result[2][i]] = `<@${currentPlayer.id}> ${ranks[i]}`;
					//mentionPlayers += `<@${currentPlayer.id}> ` + emoji(ranks[i].replace(/\s/g, '').replace(/[I]/g, '').replace("RT", '').replace('CT', ''), msg);
					mentionPlayersArr[result[2][i]] += ranks[i].includes("II") ? " II" : ranks[i].includes("I") && !ranks[i].includes("Iron") ? " I" : "";
					let serverRole = await msg.guild.roles.cache.find(role => role.name.toLowerCase() === ranks[i].toLowerCase());
					const specialRole = modeRoles[modeRoles.indexOf(ranks[i])];
					for (j = 0; j < modeRoles.length; j++) {
						if (modeRoles[j] !== specialRole) {
							let hasRole = await currentPlayer.roles.cache.some(role => role.name === modeRoles[j]);
							if (hasRole && !hasDupRoles)
								await currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === modeRoles[j].toLowerCase()));
						}
					}
					if (!hasSpecialRole)
						await currentPlayer.roles.add(serverRole.id);
					if (hasDupRoles)
						await msg.channel.send(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles. Please check if they promoted/demoted to a temprole`);
				}
			}

			if (result[1] !== ',') {
				let resultarray = result[1].split(",");
				const ranks = resultarray.slice(0, resultarray.length/2);
				const players = resultarray.slice(resultarray.length/2, resultarray.length);
				for (i = 0; i < players.length; i++) {
					let hasSpecialRole = false;
					let currentPlayer = await msg.guild.members.cache.find(member => tran_str(member.id) === tran_str(players[i])/* || member.id === '222356623392243712'*/);
					if (currentPlayer === undefined) {
						msg.channel.send("Player with id " + players[i] + " not found.");
						continue;
					}
					let hasDupRoles = checkForDuplicateRoles(LRModeRoles, currentPlayer);
					//...
					if (!mentionPlayersArr[result[3][i]]) mentionPlayersArr[result[3][i]] = `<@${currentPlayer.id}> ` + emoji(ranks[i].replace(/[I]/g, '').replace("RT ", '').replace('CT ', ''), msg);
					else mentionPlayersArr[result[3][i]] += " & " + emoji(ranks[i].replace(/[I]/g, '').replace("RT ", '').replace('CT ', ''), msg);
					//mentionPlayers += `<@${currentPlayer.id}> ` + emoji(ranks[i].replace(/\s/g, '').replace(/[I]/g, '').replace("RT", '').replace('CT', ''), msg);
					mentionPlayersArr[result[3][i]] += ranks[i].includes("II") ? " II" : ranks[i].includes("I") && !ranks[i].includes("Iron") ? " I" : "";
					let serverRole = await msg.guild.roles.cache.find(role => role.name.toLowerCase() === ranks[i].toLowerCase());
					const specialRole = LRModeRoles[LRModeRoles.indexOf(ranks[i])];
					for (j = 0; j < LRModeRoles.length; j++) {
						if (LRModeRoles[j] !== specialRole) {
							if (currentPlayer.roles.cache.some(role => role.name === LRModeRoles[j]) && !hasDupRoles)
								await currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === LRModeRoles[j].toLowerCase()));
						}
					}
					if (!hasSpecialRole)
						await currentPlayer.roles.add(serverRole.id);
					if (hasDupRoles)
						await msg.channel.send(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles. Please check if they promoted/demoted to a temprole`);
				}
			}
		}
		if (mentionPlayersArr.length != 0) {
			mentionPlayersArr = mentionPlayersArr.filter(ele => {return ele != undefined});
			mentionPlayers = mentionPlayersArr.join("\n");
		}
		if (championRole) {
			let champRoleId = globalMode === 'rt' ? /*'1087198989365039235'*/'951276509430157352' : '951276686496895026';

			let champHTML = await downloadPage(`https://mkwlounge.gg/api/ladderplayer.php?ladder_type=${globalMode}&all=1&limit=10&fields=player_name,discord_user_id,current_division,current_class`);
			let champData=JSON.parse(champHTML);
			let champPlayerId=champData.results[0].discord_user_id;
			let champPlayer = await msg.guild.members.cache.find(member => member.id === champPlayerId/* || member.id === '222356623392243712'*/);
			if (champPlayer) {
				if (!champPlayer.roles.cache.some(role => role.id === champRoleId)) {
					await champPlayer.roles.add(champRoleId);
					mentionPlayers += (mentionPlayers == '' ? '' : '\n') + `<@${champPlayerId}> :crown:`;
					for (let i = 1; i < champData.results.length; ++i) {
						let somePlayer = await msg.guild.members.cache.find(member => member.id === champData.results[i].discord_user_id);
						if (!somePlayer) continue;
						await somePlayer.roles.remove(champRoleId);
					}
				}
			}
		}
		if (mentionPlayers !== '')
			await msg.channel.send(mentionPlayers);
		//if (finalTop50Str != '') await msg.channel.send(finalTop50Str.substring(1));
	} catch (error) {
		console.error('ERROR:');
        console.error(error);
	}
});

client.on('userUpdate', (oldMember, newMember) => {
	const loungeGuild = client.guilds.cache.find(guild => guild.name === 'Lounge');
	if (loungeGuild === undefined) return console.log("Undefined guild");
	let newDisplayName = loungeGuild.members.cache.find(member => member.id === newMember.id);
	let nicknameUpdateChannel = client.channels.cache.find(channel => channel.id === '719330594617819196');
	if (nicknameUpdateChannel !== undefined && oldMember.username != newMember.username && newDisplayName.nickname === null) {
		nicknameUpdateChannel.send(`${newMember.username} changed their username from ${oldMember.username} to ${newMember.username}`);
	}
})

client.on('ready', () => {
	//client.user.setUsername("<--- me irl").then(user => console.log(`My new username is ${user.username}`)).catch(console.error())
	console.log(`Logged in as ${client.user.tag}`);

	client.user.setActivity("Pro Jones hack the mainframe", {type: "WATCHING"}).then(presence => console.log(`Activity set to ${presence.activities[0].name}`)).catch(console.error);
	// const myGuild = client.guilds.cache.find(guild => guild.name === 'GAY');
	// myGuild.members.fetch();
})

populateRolesRanges();
client.login(process.env.TOKEN);

// !editrankings RT Class F, -Infinity, RT Class E, 1000, RT Class D, 2500, RT Class C, 4000, RT Class B, 4750, RT Class A, 5500, RT Class S, 7000, RT Class X, 8500, CT Class F, -Infinity, CT Class E, 1000, CT Class D, 2250, CT Class C, 3250, CT Class B, 4500, CT Class A, 5250, CT Class S, 6750, CT Class X, 8250

// !editlrrankings RT Iron,0,RT Bronze,1250,RT Silver,2500,RT Gold,3750,RT Platinum,5000,RT Emerald,6500,RT Ruby,8000,RT Diamond,9500,RT Master,11000,RT Grandmaster,12000,CT Iron,0,CT Bronze,1250,CT Silver,2250,CT Gold,3500,CT Platinum,4750,CT Emerald,6250,CT Ruby,7500,CT Diamond,9000,CT Master,11000,CT Grandmaster,12000
