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

var finalTop50Str = "";

function populateRolesRanges() {
	rtRoles = [], ctRoles = [], rtRanges = [], ctRanges = [];
	if (!fs.existsSync(__dirname + "/rankings.txt")) {
		fs.writeFileSync(__dirname + "/rankings.txt", "RT Iron,0\nRT Bronze,1000");
	}
	let rankData = fs.readFileSync(__dirname + "/rankings.txt", "utf-8");
	rankData = rankData.split("\n");
	for (let i = 0; i < rankData.length; i++) {
		if (rankData[i].startsWith("RT")) {
			rtRoles.push(rankData[i].split(",")[0]);
			if (Number(rankData[i].split(",")[1]) != 0)
				rtRanges.push(Number(rankData[i].split(",")[1]));
		}
		if (rankData[i].startsWith("CT")) {
			ctRoles.push(rankData[i].split(",")[0]);
			if (Number(rankData[i].split(",")[1]) != 0)
				ctRanges.push(Number(rankData[i].split(",")[1]));
		}
	}
}

const downloadPage = (url) => {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
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

const determineLatestEvent = async (mode) => {
	try {
		let html = await downloadPage('https://mariokartboards.com/lounge/json/event.php?type=' + mode + '&all&compress');
		let parsedData = JSON.parse(html);
		if (parsedData.length > 0)
			return parsedData[0].warid.toString();
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
	if (inp === 'ron') inp = 'Iron';
	let theEmoji = msg_o.guild.emojis.cache.find(emoji => emoji.name == inp);
	//console.log("<:" + inp + ":" + theEmoji.id.toString() + ">");
	return ("<:" + inp + ":" + theEmoji.id.toString() + ">");
}

async function getCurrentLoungeDate() {
	try {
		let currentDate = await downloadPage("https://mariokartboards.com/lounge/json/serverstats.php");
		currentDate = JSON.parse(currentDate);
		return new Date(currentDate.server_timestamp);
	} catch(error) {
		console.log(error);
	}
}

const getRequest = async (mode, warid, msg_obj) => {
	var roles = [], members = [];
	try {
		const checkRoles = mode == 'rt' ? rtRoles : ctRoles;
		let top50names = [];
		let top50html = await downloadPage(`https://mariokartboards.com/lounge/json/player.php?type=${mode}&limit=150&compress`);
		let top50json = JSON.parse(top50html);
		let top50OnPage = [];
		let currentDate = await getCurrentLoungeDate();
		if (!currentDate) currentDate = new Date();
		for (let i = 0, counter = 0; i < top50json.length; i++) {
			let compareDate = new Date(top50json[i].last_event_date);
			if (currentDate - compareDate > activityForTop50) {
				continue;
			}
			counter++;
			top50OnPage.push(tran_str(top50json[i].name));
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
		const currentRange = mode == 'rt' ? rtRanges : ctRanges;
		if (isNaN(warid)) {
			let html = await downloadPage('https://mariokartboards.com/lounge/json/player.php?type=' + mode + '&name=' + warid);
			let parsedData = JSON.parse(html);
			let returnArray = [];
			if (parsedData.length > 0) {
				for (let i = 0; i < parsedData.length; i++) {
					returnArray.push(parsedData[i].name);
					let currentMMR = Number(parsedData[i].current_mmr);
					for (let j = 0; j < checkRoles.length; j++) {
						if (j == 0) {
							if (currentMMR < currentRange[j]) returnArray.push(checkRoles[j]);
						} else if (j == checkRoles.length-1) {
							if (currentMMR >= currentRange[j-1]) returnArray.push(checkRoles[j]);
						} else {
							if (currentMMR >= currentRange[j-1] && currentMMR < currentRange[j]) returnArray.push(checkRoles[j]);
						}
					}
				}
			} else
				return false;
			return returnArray;
		} else {
			let html = await downloadPage('https://mariokartboards.com/lounge/json/event.php?type=' + mode + '&id=' + warid + "&compress");
			let parsedData = JSON.parse(html);
			if (parsedData.length > 1) {
				for (let i = 0; i < parsedData.length; i++) {
					let promotion = parsedData[i].promotion;
					let currentMr = parsedData[i].current_mmr;
					let updatedMr = parsedData[i].updated_mmr;

					for (let j = 0; j < currentRange.length; j++) {
						if (currentMr >= currentRange[j] && updatedMr < currentRange[j]) {
							members.push(parsedData[i].name);
							roles.push(checkRoles[j]);
							continue;
						}
						if (currentMr < currentRange[j] && updatedMr >= currentRange[j]) {
							members.push(parsedData[i].name);
							roles.push(checkRoles[j+1]);
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
			return (combinedroles + "," + combinedmembers);
		}
	} catch (error) {
		console.error('ERROR:');
        console.error(error);
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
			let ldbPage = await downloadPage(`https://mariokartboards.com/lounge/json/leaderboard.php?type=${mode}`);
			ldbPage = JSON.parse(ldbPage);
			let playerswithTop50 = [];
			let playerswithTop50Col = msg_obj.guild.members.cache.filter(member => member.roles.cache.some(role => role.id == (mode == 'rt' ? '800958350446690304' : '800958359569694741')));
			if (playerswithTop50Col != undefined)
				playerswithTop50Col.each(member => playerswithTop50.push(member.id));
			let currentDate = await getCurrentLoungeDate();
			if (!currentDate) currentDate = new Date();
			for (let i = 0, counter = 0; i < ldbPage.length; i++) {
				counter++;
				let currentPlayerCollection = await msg_obj.guild.members.cache.filter(member => tran_str(member.displayName) == tran_str(ldbPage[i].name) && !member.roles.cache.some(role => role.name == "Unverified") && member.roles.cache.some(role => (mode == 'rt' ? rtRoles.includes(role.name) : ctRoles.includes(role.name))));
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
					msg_obj.channel.send("Unable to find server member with the name " + ldbPage[i].name + ", who should have " + mode.toUpperCase() + " Top 50");
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
		finalTop50Str = "";
		var contentForRankings = msg.content;
		msg.content = msg.content.toLowerCase();
		// let hahaha = await downloadPage("https://mariokartboards.com/lounge/json/player.php?type=rt&name=Fox,kenchan,Killua,neuro,Shaun,Jeff,Kaspie,barney,meraki,pachu,Quinn,Leops,Mikey,jun,Sane,rusoX,Az,EmilP,Batcake,Taz,Sora,Dane,lo,Solar,Goober");
		// hahaha = JSON.parse(hahaha);
		// console.log(hahaha);
		const commandList = ["!rt", "!ct", "!dp", "!top50", "!place", "!editrankings", "!deleterankings", "!viewrankings", "!insertrankings"];
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
		for (i = 0; i < rolesThatCanUpdate.length; i++) {
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
				let rankData = fs.readFileSync(__dirname + "/rankings.txt", "utf-8");
				rankData = rankData.split("\n");
				let updaterankmsg = "";
				for (let i = 0; i < rankData.length; i++) {
					let upperRange = i == rankData.length-1 || Number(rankData[i+1].split(",")[1]) < Number(rankData[i].split(",")[1]) ? "+" : " - " + (Number(rankData[i+1].split(",")[1].replace(/\s+/g, ''))-1).toString();
					updaterankmsg += `${rankData[i].split(",")[0]} => ${rankData[i].split(",")[1].replace(/\s+/g, '') + upperRange} MMR\n`;
				}
				return msg.channel.send(updaterankmsg);
			} catch (error) {
				return msg.channel.send("There are no rankings to view");
			}
		}

		if (msg.content.startsWith("!editrankings") || msg.content.startsWith("!deleterankings") || msg.content.startsWith("!insertrankings")) {
			let args = contentForRankings.replace("!editrankings", "").replace("!deleterankings", "").replace("!insertrankings", "");
			args = args.split(",");
			for (let arg in args) {
				while (args[arg][0] == " ") args[arg] = args[arg].substring(1);
			}
			let updaterankmsg = "";
			let rankData = fs.readFileSync(__dirname + "/rankings.txt", "utf-8");
			rankData = rankData.split("\n");
			let ranks = [], mmrs = [];
			for (let rank in rankData) {
				if (rankData[rank].replace(/\s+/g, '') != "") {
					ranks.push(rankData[rank].split(",")[0]);
					mmrs.push(rankData[rank].split(",")[1]);
				}
			}
			if (msg.content.startsWith("!editrankings") || msg.content.startsWith("!insertrankings")) {
				let insertIndex = false;
				if (msg.content.startsWith("!insertrankings")) {
					insertIndex = ranks.find(element => tran_str(element) == tran_str(args[0]));
					if (!insertIndex) {
						updaterankmsg += `Unable to find role "${args[0]}"\n`;
						return msg.channel.send(updaterankmsg);
					} else {
						args.shift();
					}
				}
				for (let i = 0; i < args.length; i++) {
					if (i%2==0) {
						let roleIndex = ranks.find(element => tran_str(element) == tran_str(args[i]));
						if (!roleIndex) {
							if (!isNaN(args[i+1])) {
								updaterankmsg += `Ranking "${args[i]}" has been added with MMR threshold ${args[i+1]}\n`;
								ranks.splice(insertIndex ? ranks.indexOf(insertIndex)+1 : ranks.length, 0, args[i]);
								mmrs.splice(insertIndex ? ranks.indexOf(insertIndex)+1 : ranks.length, 0, args[i+1]);
							} else {
								updaterankmsg += `Ranking "${args[i]}" does not have a valid mmr. This has not been added\n`;
							}
						} else {
							if (!isNaN(args[i+1])) {
								mmrs[ranks.indexOf(roleIndex)] = args[i+1];
								updaterankmsg += `The MMR threshold of "${roleIndex}" has been changed to ${args[i+1]}\n`;
							} else {
								updaterankmsg += `"${args[i+1]}" is not a valid MMR. This has not been changed\n`;
							}
						}
					}
				}
			} else {
				for (let i = 0; i < args.length; i++) {
					let roleIndex = ranks.find(element => tran_str(element) == tran_str(args[i]));
					if (!roleIndex) {
						updaterankmsg += `Unable to find/delete "${args[i]}" ranking\n`;
					} else {
						updaterankmsg += `"${roleIndex}" ranking has been deleted\n`;
						ranks.splice(roleIndex,1);
						mmrs.splice(roleIndex,1);
					}
				}
			}

			rankData = "";
			for (let i = 0; i < ranks.length; i++) {
				rankData += ranks[i] + "," + mmrs[i] + (i == ranks.length-1 ? "" : "\n");
			}
			fs.writeFileSync(__dirname + "/rankings.txt", rankData);
			populateRolesRanges();
			return msg.channel.send(updaterankmsg);
		}

		const commandParams = msg.content.split(/\s+/);
		msg.delete();

		if (commandParams[0] == "!place") {
			if (commandParams.length < 3) return msg.channel.send("One or more arguments missing");
			let currentPlayer = await msg.guild.members.cache.find(member => member.roles.cache.some(role => role.id == (commandParams[2].startsWith("rt") ? '723753340063842345' : '723753312331104317')) && tran_str(member.displayName) == tran_str(commandParams[1]));
			if (currentPlayer == undefined) {
				msg.channel.send("Unable to find server member with a placement role with the name " + commandParams[1]);
				return;
			}
			let roleName = "";
			for (let i = 2;;i++) {
				if (commandParams[i] != undefined) roleName += commandParams[i];
				else break;
			}
			let serverRole = await msg.guild.roles.cache.find(role => tran_str(role.name) == tran_str(roleName));
			if (serverRole == undefined) return msg.channel.send("Unable to find server role with the name " + roleName);
			let placeEmoji = emoji(roleName.substring(2).capitalize(), msg);

			await currentPlayer.roles.remove(commandParams[2].startsWith("rt") ? '723753340063842345' : '723753312331104317');
			await currentPlayer.roles.add(serverRole.id);
			return msg.channel.send(`<@${currentPlayer.id}> ${placeEmoji} Placement`);
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
		let resultParamsArray = [];

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
				for (j = 0; j < result.length; j++) {
					if (tran_str(commandParams[i]) === tran_str(result[j]))
						checking = false;
				}
				if (checking && i !== 0 && commandParams[i] !== "np")
					msg.channel.send("Unable to find server member with the name " + commandParams[i]);
			}
			for (i = 0; i < result.length; i++) {
				if (i % 2 === 0) {
					//extra logic for additional players
					let currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(result[i]));
					let currentPlayerCollection, collectionNames = [];
					if (currentPlayer === undefined) {
						msg.channel.send("Unable to find server member with the name " + result[i]);
						continue;
					}
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayer = await msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(result[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
						if (currentPlayer !== undefined)
							break;
					}
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayerCollection = await msg.guild.members.cache.filter(member => tran_str(member.displayName) === tran_str(result[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
						if (currentPlayerCollection !== undefined)
							currentPlayerCollection.each(member => collectionNames.push(member.user.tag));
					}
					if (currentPlayer === undefined) {
						msg.channel.send(result[i] + " does not have a rank role yet.");
						continue;
					}
					let hasDupRoles = checkForDuplicateRoles(modeRoles, currentPlayer);
					collectionNames = removeDuplicates(collectionNames);
					if (collectionNames.length > 1)
						msg.channel.send("Multiple players were found with the same display name: " + collectionNames.join(" & "));
					let serverRole = await msg.guild.roles.cache.find(role => role.name == result[i+1]);
					if (!currentPlayer.roles.cache.some(role => role.name.toLowerCase() === serverRole.name.toLowerCase())) {
						for (j = 0; j < modeRoles.length; j++) {
							if (currentPlayer.roles.cache.some(role => role.name == modeRoles[j]))
								await currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === modeRoles[j].toLowerCase()));
						}
						let fromPenText = (commandParams[i+2] === "np") ? "" : "(from pen)";
						await currentPlayer.roles.add(serverRole.id);
						mentionPlayers += `<@${currentPlayer.id}> ` + emoji(result[i+1].replace(/[I]/g, '').replace("RT ", '').replace('CT ', ''), msg);
						//mentionPlayers += `<@${currentPlayer.id}> ` + emoji(result[i+1].replace(/\s/g, '').replace(/[I]/g, '').replace("RT", '').replace('CT', ''), msg);
						mentionPlayers += result[i+1].includes("II") ? " II" : result[i+1].includes("I") && !result[i+1].includes("Iron") ? " I" : "";
						mentionPlayers += ` ${fromPenText}\n`;
					}
					if (hasDupRoles)
						msg.channel.send(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles but should be ${serverRole.name}. Check if they promoted/demoted to a temprole`);
				}
			}
		} else {
			if (commandParams.length > 2) return msg.channel.send("Error. Cannot do multiple events at a time");
			if (result !== ',') {
				let resultarray = result.split(",");
				const ranks = resultarray.slice(0, resultarray.length/2);
				const players = resultarray.slice(resultarray.length/2, resultarray.length);
				for (i = 0; i < players.length; i++) {
					let hasSpecialRole = false;
					let currentPlayer = await msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]));
					let currentPlayerCollection, collectionNames = [];
					if (currentPlayer === undefined) {
						msg.channel.send("Unable to find server member with the name " + players[i]);
						continue;
					}
					//...
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayer = await msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
						if (currentPlayer !== undefined)
							break;
					}
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayerCollection = await msg.guild.members.cache.filter(member => tran_str(member.displayName) === tran_str(players[i]) && member.roles.cache.some(role => role.name == modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
						if (currentPlayerCollection !== undefined)
							currentPlayerCollection.each(member => collectionNames.push(member.user.tag));
					}
					if (currentPlayer === undefined) {
						for (j = 0; j < specialRoles.length; j++) {
							currentPlayer = await msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]) && member.roles.cache.some(role => role.name == specialRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
							if (currentPlayer !== undefined) {
								hasSpecialRole = true;
								break;
							}
						}
					}
					if (currentPlayer === undefined) {
						msg.channel.send(players[i] + " does not have a rank role yet.");
						continue;
					}
					let hasDupRoles = checkForDuplicateRoles(modeRoles, currentPlayer);
					collectionNames = removeDuplicates(collectionNames);
					if (collectionNames.length > 1)
						msg.channel.send("2 players were found with the same display name: " + collectionNames.join(" & "));
					//...
					mentionPlayers += `<@${currentPlayer.id}> ` + emoji(ranks[i].replace(/[I]/g, '').replace("RT ", '').replace('CT ', ''), msg);
					//mentionPlayers += `<@${currentPlayer.id}> ` + emoji(ranks[i].replace(/\s/g, '').replace(/[I]/g, '').replace("RT", '').replace('CT', ''), msg);
					mentionPlayers += ranks[i].includes("II") ? " II\n" : ranks[i].includes("I") && !ranks[i].includes("Iron") ? " I\n" : "\n";
					let serverRole = await msg.guild.roles.cache.find(role => role.name.toLowerCase() === ranks[i].toLowerCase());
					const specialRole = modeRoles[modeRoles.indexOf(ranks[i])];
					for (j = 0; j < modeRoles.length; j++) {
						if (modeRoles[j] !== specialRole) {
							if (currentPlayer.roles.cache.some(role => role.name === modeRoles[j]) && !hasDupRoles)
								await currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === modeRoles[j].toLowerCase()));
						}
					}
					if (!hasSpecialRole)
						await currentPlayer.roles.add(serverRole.id);
					if (hasDupRoles)
						msg.channel.send(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles. Please check if they promoted/demoted to a temprole`);
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
})

populateRolesRanges();
client.login(process.env.TOKEN);

// !editrankings RT Iron, 0, RT Bronze, 1000, RT Silver, 2500, RT Gold, 4000, RT Ruby, 4750, RT Platinum, 5500, RT Emerald, 7000, RT Diamond, 8500, RT Master, 10000, RT Grandmaster, 11000, CT Iron, 0, CT Bronze, 1000, CT Silver, 2250, CT Gold, 3500, CT Platinum, 4500, CT Emerald, 5500, CT Diamond, 7000, CT Master, 8500, CT Grandmaster, 10000
