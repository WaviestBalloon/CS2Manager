import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteractionOptionResolver } from "discord.js";
import { serverActive, serverChildProcess } from "../utils/DedicatedServer.js";
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

	if (force) {
		exec("killall cs2");
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

	serverChildProcess.kill("SIGTERM");

	interaction.editReply({ embeds: [
		new EmbedBuilder()
			.setTitle(`Sent term signal to server!`)
			.setDescription(`*Action executed by <@${interaction.user.id}>*`)
			.setColor("#0099ff")
	] });
};
