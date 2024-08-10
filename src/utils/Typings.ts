import { ChildProcessWithoutNullStreams } from "node:child_process";

export interface ServerLaunchData {
	map: string;
	gamemode: string;
	slots: number;
	vac: boolean;
	workshopmap: number | null;
	extraparams: string;
	password: string | null;
}

export interface ServerRanData {
	process: ChildProcessWithoutNullStreams;
	ranCommand: string;
}
