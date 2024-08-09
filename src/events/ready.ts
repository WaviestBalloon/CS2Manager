import { ActivityType } from "discord.js";

let currentState = "Waiting for a server to launch...";
let clientPublic: { user: { setActivity: (arg0: string, arg1: { type: ActivityType; }) => void; }; } = null;

export const run = async (client: any, database: any) => {
	console.log(`Logged in as ${client.user?.tag}!`);
	clientPublic = client;
	client.user.setActivity("I restarted, whoops!", { type: ActivityType.Custom });

	setInterval(() => {
		client.user.setActivity(currentState, { type: ActivityType.Custom });
	}, 5000);
};

export const ChangeState = (newState: string) => {
	currentState = newState;
	clientPublic.user.setActivity(currentState, { type: ActivityType.Custom });
};
