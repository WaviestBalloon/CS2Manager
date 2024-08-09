import { EmbedBuilder, Interaction } from "discord.js";
import fs from "node:fs";
import { makeSlashLink, makeTimestamp } from "../utils/Response.js";
import { serverActive, serverEventEmitter } from "../utils/DedicatedServer.js";

let ratelimits: { userId: string, command: string, timeout: EpochTimeStamp }[] = [];
let commands = new Map();

export const loadCommands = async (): Promise<Map<any, any>> => {
	return new Promise(async (resolve) => {
		commands.clear();
		const transpiledCommands = fs.readdirSync("./dist/commands");
		const commandPromises = transpiledCommands.map(async (file) => {
			if (file.endsWith(".js")) {
				const command = await import(`../commands/${file}`);
				console.log(`Loaded ${command.data.name}`);
				commands.set(command.data.name, command);
			}
		});

		await Promise.all(commandPromises); // THIS SUCKS

		console.log(`${commands.size} commands loaded.`);
		resolve(commands);
	});
}

export const run = async (client: any, database: any, args: Interaction[]) => {
	let interaction: Interaction = args[0];
	console.log(`${interaction.user.username}#${interaction.user.discriminator} in #${interaction.channelId} triggered an interaction.`);

	if (interaction.isCommand()) {
		console.log(`${interaction.user.username}#${interaction.user.discriminator} in #${interaction.channelId} ran ${interaction.commandName}.`);
		const commandName: string = interaction.commandName;
		const command = commands.get(commandName);
		
		for (let ratelimit of ratelimits) {
			if (ratelimit.userId === interaction.user.id && ratelimit.command === commandName) {
				interaction.reply({ embeds: [
					new EmbedBuilder()
						.setDescription(`<:Timer:1162015594065961031> You are running ${makeSlashLink(interaction.commandName, interaction.commandId)} too fast! This timeout expires ${makeTimestamp(ratelimit.timeout + command.timeoutLength)}...`)
						.setFooter({ text: "You can still run other commands, this is not a global cooldown" })
						.setColor(0xd75a49)
				], ephemeral: true });
				return;
			}
		}

		ratelimits.push({ userId: interaction.user.id, command: interaction.commandName, timeout: Date.now() });
		setTimeout(() => {
			for (let ratelimit of ratelimits) {
				if (ratelimit.userId === interaction.user.id && ratelimit.command === commandName) {
					console.log(`Removed ${interaction.user.id} from ${commandName} ratelimit.`);
					ratelimits.splice(ratelimits.indexOf(ratelimit), 1);
				}
			}
		}, command?.timeoutLength ? command?.timeoutLength : 5000);

		database.inc("commandCounter");
		try {
			await command.run(client, database, interaction);
		} catch (err) {
			console.error(err);

			let embed = new EmbedBuilder()
				.setDescription(`<:Error:1162014740164386826> ${makeSlashLink(interaction.commandName, interaction.commandId)} encountered a fatal error in which the execution of the command has been terminated.\nThe following Stack has been reported: \`\`\`javascript\n${err}\`\`\``)
				.setFooter({ text: "Your command cooldown for this command has been removed, try running it again" })
				.setColor(0xd75a49)

			if (interaction.replied || interaction.deferred || interaction.ephemeral === true) {
				interaction.followUp({ embeds: [ embed ] });
			} else {
				interaction.reply({ embeds: [ embed ] });
			}

			for (let ratelimit of ratelimits) {
				if (ratelimit.userId === interaction.user.id && ratelimit.command === interaction.commandName) {
					ratelimits.splice(ratelimits.indexOf(ratelimit), 1);
				}
			}
		}
	}

	if (interaction.isButton()) {
		console.log(`${interaction.user.username}#${interaction.user.discriminator} in #${interaction.channelId} clicked a button.`);

		const buttonId: string = interaction.customId;
		const button = commands.get(buttonId);

		database.inc("buttonCounter");

		console.log(`Button ${buttonId} was clicked`);

		// switch cases just didnt want to work for some reason, oh well, small hack doesnt kill anyone right???

		if (buttonId.includes("act-")) {
			if (!serverActive) return;
			interaction.deferUpdate();

			switch (buttonId) {
				case "act-addct":
					serverEventEmitter.emit("sendCommand", "bot_add_ct");
					return;
				case "act-addt":
					serverEventEmitter.emit("sendCommand", "bot_add_t");
					return;
				case "act-endwarmup":
					serverEventEmitter.emit("sendCommand", "mp_warmup_end");
					return;
				case "act-removebots":
					serverEventEmitter.emit("sendCommand", "bot_kick");
					return;
				default:
					break;
			}
		}

		try {
			await button.run(client, database, interaction);
		} catch (err) {
			console.error(err);

			let embed = new EmbedBuilder()
				.setDescription(`<:Error:1162014740164386826> The action encountered a fatal error in which the execution of the command has been terminated.\nThe following Stack has been reported: \`\`\`javascript\n${err}\`\`\``)
				.setColor(0xd75a49)

			if (interaction.replied || interaction.deferred || interaction.ephemeral === true) {
				interaction.followUp({ embeds: [ embed ] });
			} else {
				interaction.reply({ embeds: [ embed ] });
			}
		}
	}
};
