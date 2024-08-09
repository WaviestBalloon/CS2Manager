import { Message, MessageMentions, User } from "discord.js";

export const resolveUsers = (message: Message, mentions: MessageMentions): User[] => {
	let resolvedUsers = [];
	for (const mention of mentions?.users) {
		resolvedUsers.push(mention[1]);
	}

	for (const role of mentions?.roles) {
		let users = message.guild?.roles.cache.get(role[0])?.members;
		if (users === undefined) continue;

		for (const userWithRole of users) {
			resolvedUsers.push(userWithRole[1].user);
		}
	}

	return resolvedUsers;
};
