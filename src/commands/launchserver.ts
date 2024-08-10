import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteractionOptionResolver } from "discord.js";
import { ChangeState } from "../events/ready.js";
import { ChangeLockState, LaunchServer, playersInGame, serverActive, serverEventEmitter } from "../utils/DedicatedServer.js";

export const data = new SlashCommandBuilder()
	.setName("launchserver")
	.setDescription("Start a CS2 server instance with params")
	.addStringOption((option) => option.setName("map").setDescription("The map the server will start on").setRequired(false))
	.addIntegerOption((option) => option.setName("workshopmap").setDescription("A workshop map to download and to change the server level to").setRequired(false))
	.addStringOption((option) =>
		option.setName("gamemode")
			.setDescription("The gamemode the server will start with")
			.setRequired(false)
			.addChoices(
				{ name: "competitive", value: "competitive" },
				{ name: "wingman", value: "wingman" },
				{ name: "casual", value: "casual" },
				{ name: "deathmatch", value: "deathmatch" },
				{ name: "custom", value: "custom" },
			))
	.addIntegerOption((option) => option.setName("slots").setDescription("How many players can the server allow to join").setRequired(false))
	.addBooleanOption((option) => option.setName("vac").setDescription("Disables Valve Anti-Cheat, allows for restricted accounts to join the server").setRequired(false))
	.addStringOption((option) => option.setName("extraparams").setDescription("Extra startup paramaters").setRequired(false))
	.addStringOption((option) => option.setName("password").setDescription("Set a server password").setRequired(false))
	.addBooleanOption((option) => option.setName("claim").setDescription("Instantly take ownership of server actions and commands").setRequired(false));

export const timeoutLength: number = 20000;

export const run = async (client: any, database: any, interaction: CommandInteraction, args: any) => {
	await interaction.deferReply();
	const options = interaction.options as CommandInteractionOptionResolver;

	const map = options?.getString("map") || "de_dust2";
	const gamemode = options?.getString("gamemode") || "casual";
	const slots = options?.getInteger("slots") || 10;
	const vac = options?.getBoolean("vac") || true;
	const workshopmap = options?.getInteger("workshopmap") || null;
	const extraparams = options?.getString("extraparams") || null;
	const password = options?.getString("password") || null;
	const takeClaim = options?.getBoolean("claim") || null;

	if (serverActive) {
		interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle("Server is already running")
				.setDescription("Please wait for the server to close before starting a new one or run `/stopserver` to stop the current server!")
				.setColor("#f54e4e")
		] });
		return;
	}

	if (takeClaim) {
		ChangeLockState(true, Number(interaction.user.id));
	}

	const buttons = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId("stopserver")
				.setEmoji("1271541825626312844")
				.setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
				.setCustomId("togglelock")
				.setEmoji("1271541799466434663")
				.setStyle(ButtonStyle.Primary),
		);

	const actionButtons = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId("act-endwarmup")
				.setLabel("End Warmup")
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId("act-addct")
				.setLabel("Add CT Bot")
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId("act-addt")
				.setLabel("Add T Bot")
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId("act-removebots")
				.setLabel("Kick bots")
				.setStyle(ButtonStyle.Secondary),
		)

	await interaction.editReply({ embeds: [
		new EmbedBuilder()
			.setTitle(`Starting a server on ${map} with ${slots} slots`)
			.setDescription(`Gamemode: \`${gamemode}\`\nVAC: \`${vac ? "Enabled" : "Disabled"}\`\nWorkshop Map: \`${workshopmap ? workshopmap : "None"}\`\nExtra Params: \`${extraparams ? extraparams : "None"}\``)
			.setColor("#0099ff")
			//@ts-ignore
	], components: [ buttons ] });

	ChangeState(`Starting a server on ${map}... (0/${slots} slots)`);

	const serverProcess = await LaunchServer({
		map,
		gamemode,
		slots,
		vac,
		workshopmap,
		extraparams,
		password,
	});
	const serverProcessChild = serverProcess.process;

	function update() {
		let playerList = "";
		playersInGame.forEach((player) => {
			playerList += `> - ${player}\n`;
		});

		interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle(`Running on ${map} with ${slots} slots`)
				.setDescription(`Gamemode: \`${gamemode}\`\nVAC: \`${vac ? "Enabled" : "Disabled"}\`\nWorkshop Map: \`${workshopmap ? workshopmap : "None"}\`\nExtra Params: \`${extraparams ? extraparams : "None"}\`\n\n> *Players:*\n${playerList}\n> *Enter the following in console to connect:*\n> \`connect ${process.env.IPADDRESS}:27015\``)
				.setColor("#8ded5c")
				.setFooter({ text: serverProcess.ranCommand })
				//@ts-ignore
		], components: [ buttons, actionButtons ] });
	}

	serverProcessChild.stdout.on("data", (data: any) => {
		if (data.includes("Spawn Server")) {
			ChangeState(`Running on ${gamemode} ${map}... (0/${slots} slots)`);

			update();
		}
	});

	let eventListener = serverEventEmitter.on("playerUpdateEvent", () => {
		ChangeState(`Running on ${gamemode} ${map}... (${playersInGame.length}/${slots} slots)`);

		update();
	});

	serverProcessChild.once("close", (code: any) => {
		console.log(`child process exited with code ${code}`);
		eventListener.removeAllListeners();

		ChangeState("Waiting for a server to launch...");
		interaction.editReply({ embeds: [
			new EmbedBuilder()
				.setTitle(`Server has closed`)
				.setDescription(`Child process has exited with code \`${code}\``)
				.setColor("#f54e4e")
		], components: [] });
	});
};
