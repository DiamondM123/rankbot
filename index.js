const Discord = require('discord.js');
const {config} = require('dotenv');

const request = require("request");
const latinise = require('./latinise'); //ty cheron and company

const client = new Discord.Client({disableEveryone: true});

config({
	path: __dirname + "/.env"
})


const rtRoles = ["RT Iron", "RT Bronze", "RT Silver", "RT Gold", "RT Platinum", "RT Emerald", "RT Diamond", "RT Master", "RT Grandmaster"];
const ctRoles = ["CT Iron", "CT Bronze", "CT Silver", "CT Gold", "CT Platinum", "CT Emerald", "CT Diamond", "CT Master", "CT Grandmaster"];

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

const emoji = (inp, msg_o) => {
	if (inp === 'ron') inp = 'Iron';
	let theEmoji = msg_o.guild.emojis.cache.find(emoji => emoji.name === inp);
	//console.log("<:" + inp + ":" + theEmoji.id.toString() + ">");
	return ("<:" + inp + ":" + theEmoji.id.toString() + ">");
}

const tran_str = (inp) => {
	if (inp === undefined) return undefined;
	return inp.replace(/\s/g, '').latinise().toLowerCase();
}

const getRequest = async (mode, warid, msg_obj) => {
	var roles = [], members = [];
	try {
		const checkRoles = mode == 'rt' ? rtRoles : ctRoles;
		if (isNaN(warid)) {
			let html = await downloadPage('https://mariokartboards.com/lounge/json/player.php?type=' + mode + '&name=' + warid);
			let parsedData = JSON.parse(html);
			let returnArray = [];
			if (parsedData.length > 0) {
				for (i = 0; i < parsedData.length; i++) {
					returnArray.push(parsedData[i].name);
					let currentMMR = Number(parsedData[i].current_mmr);

					let idsHolder = [];
					let currentPlayerCollection = msg_obj.guild.members.cache.filter(member => tran_str(member.displayName) === tran_str(parsedData[i].name) && member.roles.cache.some(role => checkRoles.includes(role.name)) && !member.roles.cache.some(role => role.name === "Unverified"));
					if (currentPlayerCollection !== undefined)
						currentPlayerCollection.each(member => idsHolder.push(member.id));
					if (idsHolder.length > 1) {
						let outStr = '';
						for (j = 0; j < idsHolder.length; j++) {
							outStr += (j != 0 ? " & " : "") + "<@" + idsHolder[j] + ">";
						}
						msg_obj.channel.send(`Multiple people found with the same display name: ${outStr}\nMake sure the correct one receives the top 50 role`);
					}

					let currentPlayer = msg_obj.guild.member(idsHolder[0]);

					if (Number(parsedData[i].ranking) <= 50 && currentPlayer != undefined) {
						if (!currentPlayer.roles.cache.some(role => role.id == (mode == "rt" ? '800958350446690304' : '800958359569694741'))) {
							msg_obj.channel.send(`<@${currentPlayer.id}> ` + emoji('top', msg_obj));
						}
						await currentPlayer.roles.add(mode == "rt" ? '800958350446690304' : '800958359569694741');
					} else if (currentPlayer != undefined) {
						//console.log("not good");
						if (currentPlayer.roles.cache.some(role => role.id == (mode == "rt" ? '800958350446690304' : '800958359569694741'))) {	
							await currentPlayer.roles.remove(mode == "rt" ? '800958350446690304' : '800958359569694741');
						}
					}
					if (currentMMR < 1000) {
						returnArray.push(mode.toUpperCase() + " Iron");
					} else if (currentMMR >= 1000 && currentMMR < 2500 && mode == "rt") {
						returnArray.push(mode.toUpperCase() + " Bronze");
					} else if (currentMMR >= 2500 && currentMMR < 4000 && mode == "rt") {
						returnArray.push(mode.toUpperCase() + " Silver");
					} else if (currentMMR >= 4000 && currentMMR < 5500 && mode == "rt") {
						returnArray.push(mode.toUpperCase() + " Gold");
					} else if (currentMMR >= 5500 && currentMMR < 7000 && mode == "rt") {
						returnArray.push(mode.toUpperCase() + " Platinum");
					} else if (currentMMR >= 7000 && currentMMR < 8500 && mode == "rt") {
						returnArray.push(mode.toUpperCase() + " Emerald");
					} else if (currentMMR >= 8500 && currentMMR < 10000 && mode == "rt") {
						returnArray.push(mode.toUpperCase() + " Diamond");
					} else if (currentMMR >= 10000 && currentMMR < 11000 && mode == "rt") {
						returnArray.push(mode.toUpperCase() + " Master");
					} else if (currentMMR >= 11000 && mode == "rt") {
						returnArray.push(mode.toUpperCase() + " Grandmaster");
					} else if (currentMMR >= 1000 && currentMMR < 2250 && mode == "ct") {
						returnArray.push(mode.toUpperCase() + " Bronze");
					} else if (currentMMR >= 2250 && currentMMR < 3500 && mode == "ct") {
						returnArray.push(mode.toUpperCase() + " Silver");
					} else if (currentMMR >= 3500 && currentMMR < 4500 && mode == "ct") {
						returnArray.push(mode.toUpperCase() + " Gold");
					} else if (currentMMR >= 4500 && currentMMR < 5500 && mode == "ct") {
						returnArray.push(mode.toUpperCase() + " Platinum");
					} else if (currentMMR >= 5500 && currentMMR < 7000 && mode == "ct") {
						returnArray.push(mode.toUpperCase() + " Emerald");
					} else if (currentMMR >= 7000 && currentMMR < 8500 && mode == "ct") {
						returnArray.push(mode.toUpperCase() + " Diamond");
					} else if (currentMMR >= 8500 && currentMMR < 10000 && mode == "ct") {
						returnArray.push(mode.toUpperCase() + " Master");
					} else if (currentMMR >= 10000 && mode == "ct") {
						returnArray.push(mode.toUpperCase() + " Grandmaster");
					}
				}
			} else
				return false;
			return returnArray;
		} else {
			let html = await downloadPage('https://mariokartboards.com/lounge/json/event.php?type=' + mode + '&id=' + warid + "&compress");
			let parsedData = JSON.parse(html);
			if (parsedData.length > 1) {
				for (i = 0; i < parsedData.length; i++) {
					let promotion = parsedData[i].promotion;
					let currentMr = parsedData[i].current_mmr;
					let updatedMr = parsedData[i].updated_mmr;
					let top50JSON = await downloadPage('https://mariokartboards.com/lounge/json/player.php?type=' + mode + '&name=' + parsedData[i].name);
					top50JSON = JSON.parse(top50JSON);
					// console.log(top50JSON[0].ranking);
					

					let idsHolder = [];
					let currentPlayerCollection = msg_obj.guild.members.cache.filter(member => tran_str(member.displayName) === tran_str(parsedData[i].name) && member.roles.cache.some(role => checkRoles.includes(role.name)) && !member.roles.cache.some(role => role.name === "Unverified"));
					if (currentPlayerCollection !== undefined)
						currentPlayerCollection.each(member => idsHolder.push(member.id));
					if (idsHolder.length > 1) {
						let outStr = '';
						for (j = 0; j < idsHolder.length; j++) {
							outStr += (j != 0 ? " & " : "") + "<@" + idsHolder[j] + ">";
						}
						msg_obj.channel.send(`Multiple people found with the same display name: ${outStr}\nMake sure the correct one receives the top 50 role`);
					}

					let currentPlayer = msg_obj.guild.member(idsHolder[0]);

					if (Number(top50JSON[0].ranking) <= 50 && currentPlayer != undefined) {
						//console.log("good");
						if (!currentPlayer.roles.cache.some(role => role.id == (mode == "rt" ? '800958350446690304' : '800958359569694741'))) {
							//800958912705724426
							//800986394230652928
							//801111279157641246
							msg_obj.channel.send(`<@${currentPlayer.id}> ` + emoji('top', msg_obj));
						}
						await currentPlayer.roles.add(mode == "rt" ? '800958350446690304' : '800958359569694741');
					} else if (currentPlayer != undefined) {
						//console.log("not good");
						if (currentPlayer.roles.cache.some(role => role.id == (mode == "rt" ? '800958350446690304' : '800958359569694741'))) {	
							await currentPlayer.roles.remove(mode == "rt" ? '800958350446690304' : '800958359569694741');
						}
					}

					//RTROLES
					if (currentMr >= 1000 && updatedMr < 1000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Iron");
						continue;
					}

					if (currentMr >= 2500 && updatedMr < 2500 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Bronze");
						continue;
					}

					if (currentMr < 1000 && updatedMr >= 1000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Bronze");
						continue;
					}

					if (currentMr >= 4000 && updatedMr < 4000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Silver");
						continue;
					}

					if (currentMr < 2500 && updatedMr >= 2500 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Silver");
						continue;
					}

					if (currentMr >= 5500 && updatedMr < 5500 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Gold");
						continue;
					}

					if (currentMr < 4000 && updatedMr >= 4000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Gold");
						continue;
					}

					if (currentMr >= 7000 && updatedMr < 7000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Platinum");
						continue;
					}

					if (currentMr < 5500 && updatedMr >= 5500 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Platinum");
						continue;
					}

					if (currentMr >= 8500 && updatedMr < 8500 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Emerald");
						continue;
					}

					if (currentMr < 7000 && updatedMr >= 7000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Emerald");
						continue;
					}

					if (currentMr >= 10000 && updatedMr < 10000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Diamond");
						continue;
					}

					if (currentMr < 8500 && updatedMr >= 8500 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Diamond");
						continue;
					}

					if (currentMr >= 11000 && updatedMr < 11000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Master");
						continue;
					}

					if (currentMr < 10000 && updatedMr >= 10000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Master");
						continue;
					}

					if (currentMr < 11000 && updatedMr >= 11000 && mode === "rt") {
						members.push(parsedData[i].name);
						roles.push("RT Grandmaster");
						continue;
					}













					//CTROLES
					if (currentMr >= 1000 && updatedMr < 1000 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Iron");
						continue;
					}

					if (currentMr >= 2250 && updatedMr < 2250 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Bronze");
						continue;
					}

					if (currentMr < 1000 && updatedMr >= 1000 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Bronze");
						continue;
					}

					if (currentMr >= 3500 && updatedMr < 3500 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Silver");
						continue;
					}

					if (currentMr < 2250 && updatedMr >= 2250 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Silver");
						continue;
					}

					if (currentMr >= 4500 && updatedMr < 4500 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Gold");
						continue;
					}

					if (currentMr < 3500 && updatedMr >= 3500 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Gold");
						continue;
					}

					if (currentMr >= 5500 && updatedMr < 5500 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Platinum");
						continue;
					}

					if (currentMr < 4500 && updatedMr >= 4500 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Platinum");
						continue;
					}

					if (currentMr >= 7000 && updatedMr < 7000 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Emerald");
						continue;
					}

					if (currentMr < 5500 && updatedMr >= 5500 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Emerald");
						continue;
					}

					if (currentMr >= 8500 && updatedMr < 8500 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Diamond");
						continue;
					}

					if (currentMr < 7000 && updatedMr >= 7000 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Diamond");
						continue;
					}

					if (currentMr >= 10000 && updatedMr < 10000 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Master");
						continue;
					}

					if (currentMr < 8500 && updatedMr >= 8500 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Master");
						continue;
					}

					if (currentMr < 10000 && updatedMr >= 10000 && mode === "ct") {
						members.push(parsedData[i].name);
						roles.push("CT Grandmaster");
						continue;
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
		let pageContent = await downloadPage(`https://mariokartboards.com/lounge/json/player.php?type=${mode}&limit=50&compress`);
		pageContent = JSON.parse(pageContent);
		let playerswithTop50 = [];
		let playerswithTop50Col = msg_obj.guild.members.cache.filter(member => member.roles.cache.some(role => role.id == (mode == 'rt' ? '800958350446690304' : '800958359569694741')));
		if (playerswithTop50Col != undefined)
			playerswithTop50Col.each(member => playerswithTop50.push(member.id));
		for (i = 0; i < pageContent.length; i++) {
			let currentPlayerCollection = msg_obj.guild.members.cache.filter(member => tran_str(member.displayName) == tran_str(pageContent[i].name) && !member.roles.cache.some(role => role.name == "Unverified") && member.roles.cache.some(role => (mode == 'rt' ? rtRoles.includes(role.name) : ctRoles.includes(role.name))));
			let somePlayerArr = [], currentPlayer;
			currentPlayerCollection.each(member => somePlayerArr.push(member.id));
			if (somePlayerArr.length > 1) {
				let somestr = '';
				for (j = 0; j < somePlayerArr.length; j++) {
					somestr += (j != 0 ? " & " : "") + "<@" + somePlayerArr[j] + ">";
				}
				msg_obj.channel.send(somestr + " have the same display name. <@" + somePlayerArr[0] + "> is being considered for the role");

			}
			currentPlayer = msg_obj.guild.member(somePlayerArr[0]);
			if (currentPlayer != undefined) {
				if (!currentPlayer.roles.cache.some(role => role.name == (mode == 'rt' ? '800958350446690304' : '800958359569694741'))) {
					await currentPlayer.roles.add(mode == 'rt' ? '800958350446690304' : '800958359569694741');
					msg_obj.channel.send(`<@${currentPlayer.id}> has been promoted to ${mode.toUpperCase()} <:top:795155129375522876>`);
				} else {
					msg_obj.channel.send(`<@${currentPlayer.id}> has maintained ${mode.toUpperCase()} <:top:795155129375522876>`);
				}
				let lolIndex = playerswithTop50.indexOf(currentPlayer.id);
				if (lolIndex != undefined)
					playerswithTop50.splice(lolIndex, 1);
			}
		}
		for (i = 0; i < playerswithTop50.length; i++) {
			let currentPlayer = msg_obj.guild.member(playerswithTop50[i]);
			if (currentPlayer != undefined) {
				await currentPlayer.roles.remove(mode == 'rt' ? '800958350446690304' : '800958359569694741');
				msg_obj.channel.send(`<@${currentPlayer.id}> has been demoted from ${mode.toUpperCase()} <:top:795155129375522876>`);
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
		var combinedForDP = [];
		for (i = 0; i < rtRoles.length; i++) {
			combinedForDP.push(rtRoles[i]);
		}
		for (i = 0; i < ctRoles.length; i++) {
			combinedForDP.push(ctRoles[i]);
		}

		msg.content = msg.content.toLowerCase();
		if (!msg.content.startsWith("!rt") && !msg.content.startsWith("!ct") && !msg.content.startsWith("!dp") && !msg.content.startsWith("!top50")) return;
		const rolesThatCanUpdate = ['387347888935534593', '792805904047276032', '399382503825211393', '399384750923579392', '521149807994208295', '792891432301625364', '521154917675827221', '393600567781621761', '520808645252874240'];
		// 504795505583456257
		let canUpdate = false;
		for (i = 0; i < rolesThatCanUpdate.length; i++) {
			if (msg.member.roles.cache.some(role => role.id == rolesThatCanUpdate[i])) canUpdate = true;
		}
		if (!canUpdate) {
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
		//START
		const commandParams = msg.content.split(/\s+/);
		msg.delete();

		const modes = commandParams[0].split("!");
		const globalMode = modes[1];

		var partCommandParam = commandParams[1];
		if (commandParams[1] === undefined || commandParams[1] === "")
			partCommandParam = await determineLatestEvent(globalMode);
		if (!partCommandParam) return send_dm(msg, "Error. Unable to retrieve latest war id");

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
		if (!result && !isNaN(partCommandParam)) return send_dm(msg, "Error. Unable to find player/event with the name/id " + partCommandParam);
		var mentionPlayers = '';
		let resultParamsArray = [];

		if (isNaN(partCommandParam)) {
			for (i = 0; i < commandParams.length; i++) {
				if (i !== 0 && commandParams[i] !== "np") {
					resultParamsArray.push(commandParams[i]);
				}
			}
			result = await getRequest(globalMode, resultParamsArray.join(","), msg);
			if (!result) return send_dm(msg, "Error. Unable to find players with the name(s) " + resultParamsArray.join(","));
			for (i = 0; i < commandParams.length; i++) {
				let checking = true;
				for (j = 0; j < result.length; j++) {
					if (tran_str(commandParams[i]) === tran_str(result[j]))
						checking = false;
				}
				if (checking && i !== 0 && commandParams[i] !== "np")
					send_dm(msg, "Unable to find server member with the name " + commandParams[i]);
			}
			for (i = 0; i < result.length; i++) {
				if (i % 2 === 0) {
					//extra logic for additional players
					let currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(result[i]));
					let currentPlayerCollection, collectionNames = [];
					if (currentPlayer === undefined) {
						send_dm(msg, "Unable to find server member with the name " + result[i]);
						continue;
					}
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(result[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
						if (currentPlayer !== undefined)
							break;
					}
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayerCollection = msg.guild.members.cache.filter(member => tran_str(member.displayName) === tran_str(result[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
						if (currentPlayerCollection !== undefined)
							currentPlayerCollection.each(member => collectionNames.push(member.user.tag));
					}
					if (currentPlayer === undefined) {
						send_dm(msg, result[i] + " does not have a rank role yet.");
						continue;
					}
					let hasDupRoles = checkForDuplicateRoles(modeRoles, currentPlayer);
					collectionNames = removeDuplicates(collectionNames);
					if (collectionNames.length > 1)
						msg.reply("Multiple players were found with the same display name: " + collectionNames.join(" & "));
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
						msg.reply(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles but should be ${serverRole.name}. Check if they promoted/demoted to a temprole`);
				}
			}
		} else {
			if (commandParams.length > 2) return msg.reply("Error. Cannot do multiple events at a time");
			if (result !== ',') {
				let resultarray = result.split(",");
				const ranks = resultarray.slice(0, resultarray.length/2);
				const players = resultarray.slice(resultarray.length/2, resultarray.length);
				for (i = 0; i < players.length; i++) {
					let hasSpecialRole = false;
					let currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]));
					let currentPlayerCollection, collectionNames = [];
					if (currentPlayer === undefined) {
						send_dm(msg, "Unable to find server member with the name " + players[i]);
						continue;
					}
					//...
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
						if (currentPlayer !== undefined)
							break;
					}
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayerCollection = msg.guild.members.cache.filter(member => tran_str(member.displayName) === tran_str(players[i]) && member.roles.cache.some(role => role.name == modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
						if (currentPlayerCollection !== undefined)
							currentPlayerCollection.each(member => collectionNames.push(member.user.tag));
					}
					if (currentPlayer === undefined) {
						for (j = 0; j < specialRoles.length; j++) {
							currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]) && member.roles.cache.some(role => role.name == specialRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"));
							if (currentPlayer !== undefined) {
								hasSpecialRole = true;
								break;
							}
						}
					}
					if (currentPlayer === undefined) {
						send_dm(msg, players[i] + " does not have a rank role yet.");
						continue;
					}
					let hasDupRoles = checkForDuplicateRoles(modeRoles, currentPlayer);
					collectionNames = removeDuplicates(collectionNames);
					if (collectionNames.length > 1)
						msg.reply("Note: 2 players were found with the same display name: " + collectionNames.join(" & "));
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
						msg.reply(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles. Please check if they promoted/demoted to a temprole`);
				}
			}
		}
		if (mentionPlayers !== '')
			msg.channel.send(mentionPlayers);
	} catch (error) {
		console.error('ERROR:');
        console.error(error);
	}
})

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

client.login(process.env.TOKEN);
