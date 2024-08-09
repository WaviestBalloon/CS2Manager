const Icons = {
	"Error": "1162014740164386826",
	"search": "1189291571049398344",
	"missingfile": "1191437973804294185",
	"Load": "1191497730464428112",
	"Dice": "1191582138118701096"
};

export const makeIcon = (icon: keyof typeof Icons): string => {
	return `<:${icon}:${Icons[icon]}>`;
};
