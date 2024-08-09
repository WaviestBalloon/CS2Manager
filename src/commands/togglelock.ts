import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { ChangeLockState, serverActive, serverLock } from "../utils/DedicatedServer.js";

export const data = new SlashCommandBuilder()
	.setName("togglelock")
	.setDescription("Lock or unlock actions on the server instance");

export const timeoutLength: number = 1000;

export const run = async (client: any, database: any, interaction: CommandInteraction, args: any) => {
	await interaction.deferReply();

	if (!serverActive) {
		await interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle("No server to toggle lock")
				.setDescription("You will need to start one with `/launchserver` before you can run this command!")
				.setColor("#f54e4e")
		] });
		return;
	}

	if (interaction.user.id !== "1133911326327066695" && (interaction.user.id !== serverLock.owner.toString() && serverLock.locked)) {
		await interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle(`Unable to toggle lock state`)
				.setDescription(`Only <@${serverLock.owner}> can toggle the lock state!`)
				.setColor("#f54e4e")
		], components: [] });
		return;
	}

	ChangeLockState(!serverLock.locked, Number(interaction.user.id));

	if (serverLock.locked) {
		interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle(`Locked actions on the server`)
				.setDescription(`Only <@${interaction.user.id}> can run commands/actions now!`)
				.setColor("#f54e4e")
		], components: [] });
	} else {
		interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle(`Unlocked actions on the server`)
				.setDescription(`Anybody can run commands/actions now!`)
				.setColor("#f54e4e")
		], components: [] });
	}
};
