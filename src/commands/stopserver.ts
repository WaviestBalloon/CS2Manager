import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteractionOptionResolver } from "discord.js";
import { ResetInternalState, serverActive, serverChildProcess, serverEventEmitter, serverLock } from "../utils/DedicatedServer.js";
import { exec } from "child_process";

export const data = new SlashCommandBuilder()
	.setName("stopserver")
	.setDescription("Stop the currently running CS2 server instance")
	.addBooleanOption((option) => option.setName("force").setDescription("Forcefully stop the server").setRequired(false));

export const timeoutLength: number = 5000;

export const run = async (client: any, database: any, interaction: CommandInteraction, args: any) => {
	await interaction.deferReply();
	const options = interaction.options as CommandInteractionOptionResolver;
	const force = options?.getBoolean("force") || false;

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

	if (force) {
		exec("killall cs2");
		ResetInternalState();
		interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle(`Forcefully killed any instances of \`cs2\`!`)
				.setDescription(`*Action executed by <@${interaction.user.id}>*`)
				.setColor("#0099ff")
		] });
		return;
	}
	if (!serverActive) {
		interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle("No servers to stop")
				.setDescription("You will need to start one with `/launchserver` before you can run this command!")
				.setColor("#f54e4e")
		] });
		return;
	}

	serverEventEmitter.emit("sendCommand", "quit");

	interaction.editReply({ embeds: [
		new EmbedBuilder()
			.setTitle(`Requested server to stop`)
			.setDescription(`If the server doesn't quit or is frozen, re-run this command with the \`force\` option set to \`true\`\n*Action executed by <@${interaction.user.id}>*`)
			.setColor("#0099ff")
	] });
};
