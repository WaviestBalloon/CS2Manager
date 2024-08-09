import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import Enmap from "enmap";
import fs, { existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadCommands } from "./events/interactionCreate.js";

const __filename = fileURLToPath(import.meta.url);
const cacheLocation = path.join(__filename, "..", "..", "cache");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessageTyping
	]
});
const database = new Enmap({ name: "database", fetchAll: true });

const exampleEnv = readFileSync(path.join(__filename, "..", "..", ".env.example")).toString();
let missing = false;
for (const line of exampleEnv.split("\n")) {
	if (line.startsWith("#") || line == "") continue;
	const [key, value] = line.split("=");
	if (!process.env[key]) {
		console.warn(`Missing environment variable: ${key}`);
		missing = true;
	}
}
if (missing) {
	console.error("Please consult the .env.example file for more details of where you screwed up.");
	process.exit(1);
}

console.log("Loading events...");
fs.readdirSync("./dist/events").forEach(file => {
	if (!file.endsWith(".js")) return;
	client.on(file.split(".")[0], async (...args) => {
		const event = await import(`./events/${file}`);
		event.run(client, database, args);
	});
});

console.log("Ensuring database variables are ready...");
await database.ensure("messageCounter", 0);
await database.ensure("commandCounter", 0);
await database.ensure("buttonCounter", 0);

console.log("Logging in to Discord...");
client.login(process.env.DISCORDTOKEN).then(async () => {
	let commands = client.application?.commands;
	const startTimer = Date.now();
	//await commands.set([]);

	console.log("Announcing commands...")
	fs.readdirSync("./dist/commands").forEach(async (file) => {
		if (!file.endsWith(".js")) return;
		const command = await import(`./commands/${file}`);
		command.data["contexts"] = [0, 1, 2];
		command.data["integration_types"] = [0, 1];
		await commands.create(command.data);
	});
	console.log("Commands announced, loading commands in interactionCreate...")
	await loadCommands();

	console.log(`Commands announced and loaded in ${Date.now() - startTimer}ms`);
});
