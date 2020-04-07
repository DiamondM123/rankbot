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
			return parsedData[0].warid
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
				returnArray.push(parsedData[0].name)
				const currentMMR = parsedData[0].current_mmr
				if (currentMMR < 2000) {
					returnArray.push(mode.toUpperCase() + " Bronze")
				} else if (currentMMR >= 2000 && currentMMR < 2500 && mode === "rt") {
					returnArray.push(mode.toUpperCase() + " Silver I")
				} else if (currentMMR >= 2000 && currentMMR < 3000 && mode === "ct") {
					returnArray.push(mode.toUpperCase() + " Silver I")
				} else if (currentMMR >= 2500 && currentMMR < 4000 && mode === "rt") {
					returnArray.push(mode.toUpperCase() + " Silver II")
				} else if (currentMMR >= 3000 && currentMMR < 4000 && mode === "ct") {
					returnArray.push(mode.toUpperCase() + " Silver II")
				} else if (currentMMR >= 4000 && currentMMR < 5000 && mode === "rt") {
					returnArray.push(mode.toUpperCase() + " Gold I")
				} else if (currentMMR >= 5000 && currentMMR < 6000 && mode === "rt") {
					returnArray.push(mode.toUpperCase() + " Gold II")
				} else if (currentMMR >= 4000 && currentMMR < 6000 && mode === "ct") {
					returnArray.push(mode.toUpperCase() + " Gold")
				} else if (currentMMR >= 6000 && currentMMR < 8000) {
					returnArray.push(mode.toUpperCase() + " Platinum")
				} else if (currentMMR >= 8000 && currentMMR < 10000) {
					returnArray.push(mode.toUpperCase() + " Diamond")
				} else if (currentMMR >= 10000) {
					returnArray.push(mode.toUpperCase() + " Master")
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
					if (currentMr >= 3000 && updatedMr < 3000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Silver I")
						continue //in case this gets fixed
					}
					if (currentMr < 3000 && updatedMr >= 3000 && mode === "ct") {
						members.push(parsedData[i].name)
						roles.push("CT Silver II")
						continue //in case this gets fixed
					}
					if (promotion.includes("Demoted")) {
						members.push(parsedData[i].name)
						roles.push(mode.toUpperCase() + " " + promotion.replace("Demoted ", ''))
					} else if (promotion.includes("Promoted")) {
						members.push(parsedData[i].name)
						roles.push(mode.toUpperCase() + " " + promotion.replace("Promoted ", ''))
					}
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
	return msg_o.author.send(mes).catch((e) => console.log("Unable to send messsages to " + msg_o.author.tag))
}

const tran_str = (inp) => {
	return inp.replace(/\s/g, '').latinise().toLowerCase()
}

client.on('message', async msg => {
	try {
		if (!msg.content.startsWith("!rt") && !msg.content.startsWith("!ct")) return
		const commandParams = msg.content.split(/\s+/)
		msg.delete()

		const modes = commandParams[0].split("!")
		const globalMode = modes[1]

		var partCommandParam = commandParams[1]
		if (commandParams[1] === undefined || commandParams[1] === "")
			partCommandParam = await determineLatestEvent(globalMode)
		if (!partCommandParam) return send_dm(msg, "Error. Unable to retrieve latest war id")

		if (!msg.member.hasPermission("MANAGE_ROLES")) return send_dm(msg, "This command is for legendary bosses of the almighty MMR system only")
		const rtRoles = ["RT Bronze", "RT Silver I", "RT Silver II", "RT Gold I", "RT Gold II", "RT Platinum", "RT Diamond", "RT Master"]
		const ctRoles = ["CT Bronze", "CT Silver I", "CT Silver II", "CT Gold", "CT Platinum", "CT Diamond", "CT Master"]
		const modeRoles = (globalMode === "rt") ? rtRoles : ctRoles
		const result = await getRequest(globalMode, partCommandParam)
		if (!result) return send_dm(msg, "Error. Unable to find player/event with the name/id " + partCommandParam)
		var mentionPlayers = ''

		if (isNaN(partCommandParam)) {
			//extra logic for additional players
			let currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(result[0]))
			if (currentPlayer === undefined) return send_dm(msg, "Unable to find server member with the name " + partCommandParam)
			for (j = 0; j < modeRoles.length; j++) {
				currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(result[0]) && member.roles.cache.some(role => role.name === modeRoles[j]) && !member.roles.cache.some(role => role.name === "Unverified"))
				if (currentPlayer !== undefined)
					break
			}
			if (currentPlayer === undefined) return send_dm(msg, partCommandParam + " does not have a rank role yet.")
			//end
			let serverRole = msg.guild.roles.cache.find(role => role.name === result[1])
			if (!currentPlayer.roles.cache.some(role => role.name === serverRole.name)) {
				for (j = 0; j < modeRoles.length; j++) {
					if (currentPlayer.roles.cache.some(role => role.name === modeRoles[j]))
						currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === modeRoles[j].toLowerCase()))
				}
				let fromPenText = (commandParams[2] === "np") ? "" : "(from pen)"
				currentPlayer.roles.add(serverRole.id)
				mentionPlayers += `${currentPlayer} :` + result[1].replace(globalMode.toUpperCase() + " ", '').toLowerCase().replace(" ii", ': II').replace(" i", ': I').replace("platinum", "plat")
				mentionPlayers += (mentionPlayers[mentionPlayers.length-1] === "I") ? ` ${fromPenText}\n` : `: ${fromPenText}\n`
			}
		} else {
			if (result !== ',') {
				let resultarray = result.split(",")
				const ranks = resultarray.slice(0, resultarray.length/2)
				const players = resultarray.slice(resultarray.length/2, resultarray.length)
				for (i = 0; i < players.length; i++) {
					let currentPlayer = msg.guild.members.cache.find(member => tran_str(member.displayName) === tran_str(players[i]))
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
					if (currentPlayer === undefined) {
						send_dm(msg, players[i] + " does not have a rank role yet.")
						continue
					}
					//...
					mentionPlayers += `${currentPlayer} :` + ranks[i].replace(globalMode.toUpperCase() + " ", '').toLowerCase().replace(" ii", ': II').replace(" i", ': I').replace("platinum", "plat")
					mentionPlayers += (mentionPlayers[mentionPlayers.length-1] === "I") ? "\n" : ":\n"
					let serverRole = msg.guild.roles.cache.find(role => role.name === ranks[i])
					const specialRole = modeRoles[modeRoles.indexOf(ranks[i])]
					for (j = 0; j < modeRoles.length; j++) {
						if (modeRoles[j] !== specialRole) {
							if (currentPlayer.roles.cache.some(role => role.name === modeRoles[j]))
								currentPlayer.roles.remove(currentPlayer.roles.cache.find(role => role.name.toLowerCase() === modeRoles[j].toLowerCase()))
						}
					}
					currentPlayer.roles.add(serverRole.id)
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

client.on('ready', () => {
	//client.user.setUsername("<--- me irl").then(user => console.log(`My new username is ${user.username}`)).catch(console.error())
	console.log(`Logged in as ${client.user.tag}`)

	client.user.setActivity("Pro Jones hack the mainframe", {type: "WATCHING"}).then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
  .catch(console.error);
})

client.login(process.env.TOKEN)
