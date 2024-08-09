import { Attachment, Collection } from "discord.js";

export interface ServerLaunchData {
	map: string;
	gamemode: string;
	slots: number;
	vac: boolean;
	workshopmap: number | null;
	extraparams: string;
}

export interface OutOfContextData {
	[id: string]: {
		count: number;
		messages: {
			[messageid: string]: {
				content: string;
				ev: Collection<string, Attachment>;
				by: number | string;
				timestamp: number;
				dtimestamp: number;
				victims: string[];
			}
		}
	}
}
export interface OutOfContextQuote {
	content: string;
	ev: Collection<string, Attachment>;
	by: number | string;
	timestamp: number;
	dtimestamp: number;
	victims: string[];
}

export interface AcknowledgementMessageData {
	[messageId: string]: {
		timestamp: number;
		locationData: {
			guildId: string;
			channelId: string;
		}
	}
}
