export const makeMention = (userId: string): string => { // D.JS doesn't treat userIds as integers, so we have to treat it as a string :(
	return `<@${userId}>`;
};
export const makeRoleMention = (roleId: string): string => {
	return `<@&${roleId}>`;
};
export const makeChannelLink = (channelId: string): string => {
	return `<#${channelId}>`;
};
export const makeMessageJumpLink = (guildId: string, channelId: string, messageId: string): string => {
	return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
};

export const makeSlashLink = (commandName: string, commandId?: string): string => {
	return `</${commandName}:${commandId || 0}>`;
};

export const makeTimestamp = (timestamp: number): string => {
	return `<t:${Math.floor(timestamp / 1000)}:R>`;
};
