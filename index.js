const Discord = require('discord.js')
const {config} = require('dotenv')

const request = require("request")
const latinise = require('./latinise') //ty cheron and company

const client = new Discord.Client({disableEveryone: true})

config({
	path: __dirname + "/.env"
})

const downloadPage = (url) => {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>')
                console.log("LOL LOSER")
            }
            resolve(body)
        })
    })
}

const determineLatestEvent = async (mode) => {
	try {
		let html = await downloadPage('https://mariokartboards.com/lounge/json/event.php?type=' + mode + '&all')
		let parsedData = JSON.parse(html)
		if (parsedData.length > 0)
			return parsedData[0].warid.toString()
		else
			return false
	} catch (error) {
		console.error('ERROR:')
        console.error(error)
	}
}

const getRequest = async (mode, warid) => {
	var roles = [], members = []
	try {
		if (isNaN(warid)) {
			let html = await downloadPage('https://mariokartboards.com/lounge/json/player.php?type=' + mode + '&name=' + warid)
			let parsedData = JSON.parse(html)
			let returnArray = []
			if (parsedData.length > 0) {
				for (i = 0; i < parsedData.length; i++) {
					returnArray.push(parsedData[i].name)
					const currentMMR = parsedData[i].current_mmr
					if (currentMMR < 1500) {
						returnArray.push(mode.toUpperCase() + " Iron")
					} else if (currentMMR >= 1500 && currentMMR < 3250) {
						returnArray.push(mode.toUpperCase() + " Bronze")
					} else if (currentMMR >= 3250 && currentMMR < 5000 && mode === "rt") {
						returnArray.push(mode.toUpperCase() + " Silver")
					} else if (currentMMR >= 3250 && currentMMR < 4000 && mode === "ct") {
						returnArray.push(mode.toUpperCase() + " Silver I")
					}else if (currentMMR >= 4000 && currentMMR < 5000 && mode === "ct") {
						returnArray.push(mode.toUpperCase() + " Silver II")
					}else if (currentMMR >= 5000 && currentMMR < 6000 && mode === "rt") {
						returnArray.push(mode.toUpperCase() + " Gold I")
					} else if (currentMMR >= 6000 && currentMMR < 7000 && mode === "rt") {
						returnArray.push(mode.toUpperCase() + " Gold II")
					} else if (currentMMR >= 5000 && currentMMR < 7000 && mode === "ct") {
						returnArray.push(mode.toUpperCase() + " Gold")
					} else if (currentMMR >= 7000 && currentMMR < 9000) {
						returnArray.push(mode.toUpperCase() + " Platinum")
					} else if (currentMMR >= 9000 && currentMMR < 11000) {
						returnArray.push(mode.toUpperCase() + " Diamond")
					} else if (currentMMR >= 11000) {
						returnArray.push(mode.toUpperCase() + " Master")
					}
				}
			} else
				return false
			return returnArray
		} else {
			let html = await downloadPage('https://mariokartboards.com/lounge/json/event.php?type=' + mode + '&id=' + warid)
			let parsedData = JSON.parse(html)
			if (parsedData.length > 1) {
				for (i = 0; i < parsedData.length; i++) {
					let promotion = parsedData[i].promotion
					let currentMr = parsedData[i].current_mmr
					let updatedMr = parsedData[i].updated_mmr

					//RTROLES
					if (currentMr >= 1500 && updatedMr < 1500 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Iron")
						continue
					}

					if (currentMr >= 3250 && updatedMr < 3250 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Bronze")
						continue
					}

					if (currentMr < 1500 && updatedMr >= 1500 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Bronze")
						continue
					}

					if (currentMr >= 5000 && updatedMr < 5000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Silver")
						continue
					}

					if (currentMr < 3250 && updatedMr >= 3250 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Silver")
						continue
					}

					if (currentMr >= 7000 && updatedMr < 7000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Gold II")
						continue
					}

					if (currentMr < 6000 && updatedMr >= 6000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Gold II")
						continue
					}

					if (currentMr < 5000 && updatedMr >= 5000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Gold I")
						continue
					}

					if (currentMr >= 6000 && updatedMr < 6000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Gold I")
						continue
					}

					if (currentMr >= 9000 && updatedMr < 9000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Platinum")
						continue
					}

					if (currentMr < 7000 && updatedMr >= 7000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Platinum")
						continue
					}

					if (currentMr >= 11000 && updatedMr < 11000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Diamond")
						continue
					}

					if (currentMr < 9000 && updatedMr >= 9000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Diamond")
						continue
					}

					if (currentMr < 11000 && updatedMr >= 11000 && mode === "rt") {
						members.push(parsedData[i].name)
						roles.push("RT Master")
						continue
					}

					//CTROLES
					if (currentMr >= 1500 && updatedMr < 1500 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Iron")
						continue
					}

					if (currentMr >= 3250 && updatedMr < 3250 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Bronze")
						continue
					}

					if (currentMr < 1500 && updatedMr >= 1500 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Bronze")
						continue
					}

					if (currentMr >= 5000 && updatedMr < 5000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Silver II")
						continue
					}

					if (currentMr < 4000 && updatedMr >= 4000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Silver II")
						continue
					}

					if (currentMr >= 4000 && updatedMr < 4000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Silver I")
						continue
					}

					if (currentMr < 3250 && updatedMr >= 3250 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Silver I")
						continue
					}

					if (currentMr >= 7000 && updatedMr < 7000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Gold")
						continue
					}

					if (currentMr < 5000 && updatedMr >= 5000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Gold")
						continue
					}

					if (currentMr >= 9000 && updatedMr < 9000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Platinum")
						continue
					}

					if (currentMr < 7000 && updatedMr >= 7000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Platinum")
						continue
					}

					if (currentMr >= 11000 && updatedMr < 11000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Diamond")
						continue
					}

					if (currentMr < 9000 && updatedMr >= 9000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Diamond")
						continue
					}

					if (currentMr < 11000 && updatedMr >= 11000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Master")
						continue
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
				return false
			let combinedroles = roles.join(",")
			let combinedmembers = members.join(",")
			return (combinedroles + "," + combinedmembers)
		}
	} catch (error) {
		console.error('ERROR:')
        console.error(error)
	}
}

const send_dm = (msg_o, mes) => {
	return msg_o.author.send(mes).catch((e) => console.log("Unable to send messsages to " + msg_o.author.tag + ", who attempted to use this bot"))
}

const tran_str = (inp) => {
	if (inp === undefined) return undefined
	return inp.replace(/\s/g, '').latinise().toLowerCase()
}

const emoji = (inp, msg_o) => {
	if (inp === 'ron') inp = 'iron'
	let theEmoji = msg_o.guild.emojis.cache.find(emoji => emoji.name === inp)
	return ("<:" + inp + ":" + theEmoji.id.toString() + ">")
}

const checkForDuplicateRoles = (rolesArr, player) => {
	let roleCount = 0
	rolesArr.forEach((roleVal) => {
		if (player.roles.cache.some(role => role.name === roleVal)) {
			roleCount++
		}
	})
	if (roleCount > 1)
		return true
	else
		return false
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
    	x[i] = true
    }
  })
  return Object.keys(x)
};

client.on('message', async msg => {
	try {
		msg.content = msg.content.toLowerCase()
		if (!msg.content.startsWith("!rt") && !msg.content.startsWith("!ct") && !msg.content.startsWith("!dp")) return
		if (!msg.member.hasPermission("MANAGE_ROLES")) return// msg.reply("You do not have permissions to use this")
		if (msg.content.startsWith("!dp")) {
			let memberList = []
			msg.guild.members.cache.each(member => memberList.push(member.displayName))
			for (i = 0; i < memberList.length; i++)
				memberList[i] = tran_str(memberList[i])
			let duplicateValues = findDuplicatePlayers(memberList)
			let listStr = duplicateValues.length !== 0 ? duplicateValues.join(", ") : "None"
			return msg.channel.send("Players with similar display names in this server: " + listStr)
		}
		//START
		const commandParams = msg.content.split(/\s+/)
		msg.delete()

		const modes = commandParams[0].split("!")
		const globalMode = modes[1]

		var partCommandParam = commandParams[1]
		if (commandParams[1] === undefined || commandParams[1] === "")
			partCommandParam = await determineLatestEvent(globalMode)
		if (!partCommandParam) return send_dm(msg, "Error. Unable to retrieve latest war id")

		const rtRoles = ["RT Iron", "RT Bronze", "RT Silver", "RT Gold I", "RT Gold II", "RT Platinum", "RT Diamond", "RT Master"]
		const ctRoles = ["CT Iron", "CT Bronze", "CT Silver I", "CT Silver II", "CT Gold", "CT Platinum", "CT Diamond", "CT Master"]
		const specialRoles = ["Boss", "Custom Track Arbitrator", "Lower Tier Arbitrator", "Higher Tier Arbitrator", "LT RT Reporter", "LT CT Reporter"]
		const modeRoles = (globalMode === "rt") ? rtRoles : ctRoles
		
		if (commandParams.length > 2) {
			for (i = 0; i < commandParams.length; i++) {
				if (isNaN(commandParams[1])) {
					if (!isNaN(commandParams[i])) {
						return msg.reply("There are differing value types in your arguments")
					}
				} else {
					if (isNaN(commandParams[i])) {
						return msg.reply("There are differing value types in your arguments")
					}
				}
			}
		}
		let result = await getRequest(globalMode, partCommandParam)
		if (!result && !isNaN(partCommandParam)) return send_dm(msg, "Error. Unable to find player/event with the name/id " + partCommandParam)
		var mentionPlayers = ''
		let resultParamsArray = []

		if (isNaN(partCommandParam)) {
			for (i = 0; i < commandParams.length; i++) {
				if (i !== 0 && commandParams[i] !== "np") {
					resultParamsArray.push(commandParams[i])
				}
			}
			result = await getRequest(globalMode, resultParamsArray.join(","))
			if (!result) return send_dm(msg, "Error. Unable to find players with the name(s) " + resultParamsArray.join(","))
			for (i = 0; i < commandParams.length; i++) {
				let checking = true
				for (j = 0; j < result.length; j++) {
					if (tran_str(commandParams[i]) === tran_str(result[j]))
						checking = false
				}
				if (checking && i !== 0 && commandParams[i] !== "np")
					send_dm(msg, "Unable to find server member with the name " + commandParams[i])
			}
			for (i = 0; i < result.length; i++) {
				if (i % 2 === 0) {
					//extra logic for additional players
					let currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(result[i]))
					let currentPlayerCollection, collectionNames = []
					if (currentPlayer === undefined) {
						send_dm(msg, "Unable to find server member with the name " + result[i])
						continue
					}
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(result[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"))
						if (currentPlayer !== undefined)
							break
					}
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayerCollection = msg.guild.members.cache.filter(member => tran_str(member.displayName) === tran_str(result[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"))
						if (currentPlayerCollection !== undefined)
							currentPlayerCollection.each(member => collectionNames.push(member.user.tag))
					}
					if (currentPlayer === undefined) {
						send_dm(msg, result[i] + " does not have a rank role yet.")
						continue
					}
					let hasDupRoles = checkForDuplicateRoles(modeRoles, currentPlayer)
					collectionNames = removeDuplicates(collectionNames)
					if (collectionNames.length > 1)
						msg.reply("Multiple players were found with the same display name: " + collectionNames.join(" & "))
					let serverRole = msg.guild.roles.cache.find(role => role.name === result[i+1])
					if (!currentPlayer.roles.cache.some(role => role.name.toLowerCase() === serverRole.name.toLowerCase())) {
						for (j = 0; j < modeRoles.length; j++) {
							if (currentPlayer.roles.cache.some(role => role.name === modeRoles[j]))
								currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === modeRoles[j].toLowerCase()))
						}
						let fromPenText = (commandParams[i+2] === "np") ? "" : "(from pen)"
						currentPlayer.roles.add(serverRole.id)
						mentionPlayers += `<@${currentPlayer.id}> ` + emoji(result[i+1].replace("Platinum", "plat").replace(/\s/g, '').replace(/[I]/g, '').replace("RT", '').replace('CT', '').toLowerCase(), msg)
						mentionPlayers += result[i+1].includes("II") ? " II" : result[i+1].includes("I") && !result[i+1].includes("Iron") ? " I" : ""
						mentionPlayers += ` ${fromPenText}\n`
					}
					if (hasDupRoles)
						msg.reply(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles but should be ${serverRole.name}. Double check if they promoted/demoted to a temprole`)
				}
			}
		} else {
			if (commandParams.length > 2) return msg.reply("Error. Cannot do multiple events at a time")
			if (result !== ',') {
				let resultarray = result.split(",")
				const ranks = resultarray.slice(0, resultarray.length/2)
				const players = resultarray.slice(resultarray.length/2, resultarray.length)
				for (i = 0; i < players.length; i++) {
					let hasSpecialRole = false
					let currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]))
					let currentPlayerCollection, collectionNames = []
					if (currentPlayer === undefined) {
						send_dm(msg, "Unable to find server member with the name " + players[i])
						continue
					}
					//...
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"))
						if (currentPlayer !== undefined)
							break
					}
					for (j = 0; j < modeRoles.length; j++) {
						currentPlayerCollection = msg.guild.members.cache.filter(member => tran_str(member.displayName) === tran_str(players[i]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"))
						if (currentPlayerCollection !== undefined)
							currentPlayerCollection.each(member => collectionNames.push(member.user.tag))
					}
					if (currentPlayer === undefined) {
						for (j = 0; j < specialRoles.length; j++) {
							currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]) && member.roles.cache.some(role => role.name === specialRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"))
							if (currentPlayer !== undefined) {
								hasSpecialRole = true
								break
							}
						}
					}
					if (currentPlayer === undefined) {
						send_dm(msg, players[i] + " does not have a rank role yet.")
						continue
					}
					let hasDupRoles = checkForDuplicateRoles(modeRoles, currentPlayer)
					collectionNames = removeDuplicates(collectionNames)
					if (collectionNames.length > 1)
						msg.reply("Note: 2 players were found with the same display name: " + collectionNames.join(" & "))
					//...
					mentionPlayers += `<@${currentPlayer.id}> ` + emoji(ranks[i].replace("Platinum", "plat").replace(/\s/g, '').replace(/[I]/g, '').replace("RT", '').replace('CT', '').toLowerCase().replace("slver", "silver"), msg)
					mentionPlayers += ranks[i].includes("II") ? " II\n" : ranks[i].includes("I") && !ranks[i].includes("Iron") ? " I\n" : "\n"
					let serverRole = msg.guild.roles.cache.find(role => role.name.toLowerCase() === ranks[i].toLowerCase())
					const specialRole = modeRoles[modeRoles.indexOf(ranks[i])]
					for (j = 0; j < modeRoles.length; j++) {
						if (modeRoles[j] !== specialRole) {
							if (currentPlayer.roles.cache.some(role => role.name === modeRoles[j]) && !hasDupRoles)
								currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === modeRoles[j].toLowerCase()))
						}
					}
					if (!hasSpecialRole)
						currentPlayer.roles.add(serverRole.id)
					if (hasDupRoles)
						msg.reply(`${currentPlayer.displayName} has multiple ${globalMode.toUpperCase()} roles. Please check if they promoted/demoted to a temprole`)
				}
			}
		}
		if (mentionPlayers !== '')
			msg.channel.send(mentionPlayers)
	} catch (error) {
		console.error('ERROR:')
        console.error(error)
	}
})

client.on('userUpdate', (oldMember, newMember) => {
	const loungeGuild = client.guilds.cache.find(guild => guild.name === 'Lounge')
	if (loungeGuild === undefined) return console.log("Undefined guild")
	let newDisplayName = loungeGuild.members.cache.find(member => member.id === newMember.id)
	let nicknameUpdateChannel = client.channels.cache.find(channel => channel.id === '719330594617819196')
	if (nicknameUpdateChannel !== undefined && oldMember.username != newMember.username && newDisplayName.nickname === null) {
		nicknameUpdateChannel.send(`${newMember.username} changed their username from ${oldMember.username} to ${newMember.username}`)
	}
})

client.on('ready', () => {
	//client.user.setUsername("<--- me irl").then(user => console.log(`My new username is ${user.username}`)).catch(console.error())
	console.log(`Logged in as ${client.user.tag}`)

	client.user.setActivity("Pro Jones hack the mainframe", {type: "WATCHING"}).then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
  .catch(console.error);
})

client.login(process.env.TOKEN)
