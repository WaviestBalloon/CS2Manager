import { ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import { ServerLaunchData, ServerRanData } from "./Typings.js";
import { existsSync } from "fs";
import EventEmitter from "events";

export let serverChildProcess: ChildProcessWithoutNullStreams | null = null;
export let serverActive: boolean = false;
export let serverLock: {
	locked: boolean;
	owner: number;
} = {
	locked: false,
	owner: 0
};
export let playersInGame: string[] = [];
export let serverEventEmitter: EventEmitter = new EventEmitter();

export const LaunchServer = (launchData: ServerLaunchData): Promise<ServerRanData> => {
	console.log("Launching server with data: ", launchData);
	serverActive = true;

	const params: string[] = [];
	params.push("-dedicated");
	if (launchData.vac == false) params.push(`-insecure`);
	if (launchData.slots) {
		params.push(`-maxplayers ${launchData.slots}`);
		params.push(`-maxplayers_override ${launchData.slots}`);
	}
	if (launchData.gamemode) params.push(`+game_alias ${launchData.gamemode}`);
	if (launchData.map) params.push(`+map ${launchData.map}`);
	if (launchData.workshopmap) params.push(`+host_workshop_map ${launchData.workshopmap}`);
	if (launchData.extraparams) params.push(launchData.extraparams);
	if (launchData.password) params.push(`+sv_password "${launchData.password}"`);
	params.push(`+sv_parallel_sendsnapshot "3"`);
	params.push(`+sv_setsteamaccount "${process.env.STEAMWEBAPIKEY}"`);

	const command = `./cs2 ${params.join(" ")}`;
	console.log(`Running command: ${command}`);

	return new Promise((resolve, reject) => {
		if (!existsSync(process.env.DEDICATEDSERVERBINARYLOCATION)) {
			serverActive = false;
			reject("The server binary location does not exist!");
		}

		//serverChildProcess = spawn(command, params, { shell: false, cwd: process.env.DEDICATEDSERVERBINARYLOCATION });
		serverChildProcess = exec(command, { cwd: process.env.DEDICATEDSERVERBINARYLOCATION });

		serverChildProcess.stdout.on("data", (data: any) => {
			const dataString = data.toString();
			const dataBuff = dataString.split("\n");

			for (let line of dataBuff) {
				console.log(`[SERVER] ${line}`);

				if (line.includes("SIGNONSTATE_CONNECTED") || line.includes("SIGNONSTATE_FULL")) {
					// Client 0 'WaviestBalloon' signon state SIGNONSTATE_PRESPAWN -> SIGNONSTATE_SPAWN
					console.log(`Player connected: ${line}`);
	
					let username = line.toString().split("'")[1];
					if (username == undefined || username == "" || username == null) {
						return;
					}

					if (!playersInGame.includes(username)) {
						playersInGame.push(username);
						serverEventEmitter.emit("playerUpdateEvent");
					} else {
						console.warn("Player already in game; skipping update");
					}
				} else if (
					line.includes("Dropped client") ||
					line.includes("NETWORK_DISCONNECT_DISCONNECT_BY_USER") ||
					line.includes("NETWORK_DISCONNECT_KICKED_IDLE") ||
					line.includes("SIGNONSTATE_NONE")
				) {
					// Dropped client 'WaviestBalloon' from server(2): NETWORK_DISCONNECT_DISCONNECT_BY_USER
					//SV:  Dropped client 'WaviestBalloon' from server(158): NETWORK_DISCONNECT_KICKED_IDLE
					//Client 0 'WaviestBalloon' signon state SIGNONSTATE_FULL -> SIGNONSTATE_NONE
					console.log(`Dropped player: ${line}`);
	
					let username = line.toString().split("'")[1];
					if (username == undefined || username == "" || username == null) {
						return;
					}

					if (playersInGame.includes(username)) {
						playersInGame.splice(playersInGame.indexOf(username), 1);
						serverEventEmitter.emit("playerUpdateEvent");
					} else {
						console.warn("Player is not in array, probably duplicate events; skipping update");
					}
				}
			}
		});
		serverChildProcess.once("exit", (code: any) => {
			console.log("Server closed; resetting exported variables");
			ResetInternalState();
		});
		serverEventEmitter.on("sendCommand", (command: string) => {
			console.log(`Sending command to server: ${command}`);
			serverChildProcess.stdin.write(command + "\n");

			if (command == "quit") {
				console.log("Server quit command sent; resetting exported variables");
				ResetInternalState();
			}
		});

		resolve({
			process: serverChildProcess,
			ranCommand: command.replace(process.env.STEAMWEBAPIKEY, "REDACTED")
		});
	});
}

export const ChangeLockState = (state: boolean, userOwner: number) => {
	serverLock = {
		locked: state,
		owner: userOwner
	};
}

export const ResetInternalState = () => {
	serverActive = false;
	serverChildProcess = null;
	playersInGame = [];
	serverLock = {
		locked: false,
		owner: 0
	};
};
