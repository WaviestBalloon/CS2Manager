import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteractionOptionResolver } from "discord.js";
import { ChangeLockState, serverActive, serverEventEmitter, serverLock } from "../utils/DedicatedServer.js";

export const data = new SlashCommandBuilder()
	.setName("sendcommand")
	.setDescription("Send a command to stdin of the server instance")
	.addStringOption((option) => option.setName("command").setDescription("The command to send to the server, can be chained, e.g. `bot_add_ct ; bot_add ; mp_warmup_end`").setRequired(true));

export const timeoutLength: number = 1000;

export const run = async (client: any, database: any, interaction: CommandInteraction, args: any) => {
	await interaction.deferReply();
	const options = interaction.options as CommandInteractionOptionResolver;

	if (!serverActive) {
		await interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle("No server to send command to")
				.setDescription("You will need to start one with `/launchserver` before you can run this command!")
				.setColor("#f54e4e")
		] });
		return;
	}

	if (serverLock.locked) {
		if (interaction.user.id !== "1133911326327066695" && interaction.user.id !== serverLock.owner.toString()) {
			await interaction.editReply({ embeds: [
				new EmbedBuilder()
					.setTitle(`Unable to run command`)
					.setDescription(`Only <@${serverLock.owner}> can use this command as they have claimed the server!`)
					.setColor("#f54e4e")
			], components: [] });
			return;
		}
	}

	const command = options.getString("command");
	serverEventEmitter.emit("sendCommand", command);

	interaction.editReply({ content: `Sent command: \`${command}\`` });
};
