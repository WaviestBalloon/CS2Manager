import { Message } from "discord.js";
import { AcknowledgementMessageData } from "./Typings.js";

export async function RegisterLeftoverMessage(message: Message, database: any, timeout?: number) {
	let leftOversEntries: AcknowledgementMessageData = await database.get("leftovers") || {};
	leftOversEntries[message.id] = {
		timestamp: Date.now(),
		locationData: {
			guildId: message.guildId,
			channelId: message.channelId
		}
	};

	database.set("leftovers", leftOversEntries);
	console.log(`Registered leftover (${message.id}) with the lifetime of ${timeout}ms!`);

	setTimeout(async () => {
		console.log(`Deleting leftover: ${message.id}...`);
		try {
			await message.delete();
		} catch (e) {
			console.warn("Failed to delete message acknowledgement: " + e);
		}

		let leftOversEntries: AcknowledgementMessageData = await database.get("leftovers");
		delete leftOversEntries[message.id];
		await database.set("leftovers", leftOversEntries);
	}, 30000);
}
