import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Startup header: purple planet ASCII (centered), mid size.
 * Runs after gentle-pi's setHeader (50ms) so it wins the last write.
 */
const PURPLE = (text: string) => `\x1b[38;2;168;85;247m${text}\x1b[39m`;

const PLANET_LOGO = [
	"⠀⢀⣠⣶⠶⣶⣶⣶⣤⣄⣀⡀",
	"⢠⣿⢟⣵⣿⡿⠛⠛⠛⠛⠻⠿⣷⣦⣤",
	"⣼⣿⣼⣿⠏⢠⣾⣿⣿⣿⣿⣷⣶⣬⣝⢷⣦⣄⠀⠀⠀⠀⣤⢤⣴⣶⡶⠛⣛⢫⣶⣾⣶⣦⣤⣀",
	"⢹⢻⢻⣿⠀⣿⣿⣿⣭⣶⠾⠟⠺⠿⢿⣷⣦⠝⣫⡴⢺⣿⡇⢻⣿⢿⣧⠀⢿⣮⣿⣿⣿⣿⣿⣿⣿⣦⣄",
	"⠸⡏⣾⣿⡄⢻⣿⣿⣿⠁⡔⠋⠉⠉⠐⣩⡴⠋⢹⠁⢸⣿⢿⡌⢻⣦⣿⣷⣄⠙⣽⣿⣿⣿⣿⣿⣿⣿⣿⡿⢦⣄",
	"⠀⢻⡸⣿⣷⠈⣿⣿⣿⠀⠀⠀⠀⠀⣠⣇⠀⠀⠈⠀⠸⣿⣿⣾⡢⠙⠻⣿⣿⣿⣈⠙⠛⠿⢶⣭⣍⠯⠭⠔⠃⠈⣻⣧",
	"⠀⠘⣇⢻⣿⣇⠸⣿⣿⡀⠇⠀⠀⡼⣿⡇⠀⠀⠀⡀⠀⠻⢿⣿⣿⣤⡀⠘⢿⣿⣿⣿⣤⣄⣀⠀⠀⠠⠄⠀⣀⣠⣿⣿⣇",
	"⠀⠀⠘⣇⠻⣿⣄⠻⣿⣷⡈⠀⠞⡁⣿⣿⣶⢦⠀⠐⠀⠀⢮⡛⢿⣿⣿⣷⣦⣌⠻⢿⣿⣿⣿⣿⣿⣶⣾⣿⣿⣿⣿⡿⢷⡄",
	"⠀⠀⠀⠀⠈⢻⣷⡉⠻⣿⣿⣿⣄⠈⣿⡌⢾⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠙⠷⣮⠛⠿⣿⣿⣿⣿⣿⣿⠿⠟⣋⡀⠀⠀⣠⣾⣿⣇",
	"⠀⠀⠀⠀⠀⠀⠹⣿⣒⠈⣿⣯⡻⣦⡈⣎⠈⠻⣿⣿⣦⣄⠢⣤⡀⠀⠀⠀⠀⠀⡙⠒⠀⠈⠙⠛⠛⠛⠛⠉⣠⣤⣦⣤⣿⠟⠀⢿⡄",
	"⠀⠀⠀⠀⠀⠀⠀⠀⢿⣧⡈⢿⣿⣝⢷⠙⢧⡀⣈⠻⣿⣿⠀⠈⠛⠦⡀⠀⠀⠀⠈⠉⠉⠀⠀⠀⣠⣦⣄⣸⣿⡿⣫⣽⣯⠟⠀⣸⣾⡆",
	"⠀⠀⠀⠀⠀⠀⠀⠀⡄⠻⣿⣄⠙⣿⣷⣦⡈⠻⣿⣷⡌⠙⣷⣦⣀⠂⢄⣀⡀⠀⠀⡉⠲⠶⠶⠟⠻⣷⣾⣿⣿⣱⠟⠉⠐⢀⣴⢯⣷",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠱⠀⠈⠻⣷⣌⠻⣮⡻⣦⡈⠻⣿⣦⠻⢿⣿⣿⣶⣍⣙⠷⣿⣿⣷⣶⣶⣾⣿⠿⠋⡩⠽⠛⠒⠁⢀⣨⣴⢏⣻",
	"⠀⠀⠀⠀⠀⠀⠀⠀⣄⠁⠀⠀⠉⢿⣧⠻⣿⣮⡻⣦⡈⠻⣦⣕⡿⢿⣶⣭⣉⡛⠦⠄⠉⠉⠑⠛⠻⠒⠀⢀⣤⠶⢀⣴⣿⠟⣡⠏⣸",
	"⠀⠀⠀⠀⠀⠀⠀⠀⣿⣦⡀⠀⠀⠀⠙⣦⡈⠻⣷⣎⡻⣦⠻⣿⣿⣶⣯⣝⣿⣿⣖⣲⣶⣤⣤⣤⣄⣤⣴⣶⣶⣶⠻⣉⡴⠟⠁⡰⣿",
	"⠀⠀⠀⠀⠀⠀⠀⠀⡎⢇⢻⣿⣇⠘⠆⢄⠀⠙⢿⣦⣈⠻⣮⣛⣷⣄⠑⠶⣶⣦⣮⣽⣿⣿⣿⣯⣶⠻⡿⢟⡹⠃⠀⢁⠀⠀⣠⣶⠇⡀",
	"⠀⠀⠀⠀⠀⠀⠀⠀⢻⠈⠢⡙⢿⢷⣤⡀⠑⠠⡀⠛⢿⣷⠛⢿⣷⣝⢿⣦⡈⠙⠛⠛⠒⠒⠂⠀⠀⠛⠛⠉⡠⠒⡉⠉⣴⡴⠋⡾⣀⢿⣄",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⡀⠹⡀⠙⠲⣛⢦⡀⠀⠀⠀⠈⣷⣄⠙⠻⣿⣮⡻⣶⡉⠀⠈⠃⠀⠀⠀⠀⠀⠀⠰⠏⢂⣼⠋⠀⣼⢡⣿⣦⠻⣮⡀",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣯⠀⠀⢀⠰⠙⣿⣷⣤⣀⠀⠀⠀⠉⢳⣶⣌⠻⢿⣷⡿⣦⣄⠀⠀⠀⣀⣤⣤⣥⡴⣾⠿⠒⣠⣾⠃⢂⢻⣿⣧⡙⣧",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢧⠀⠈⠢⢷⡜⢧⡉⠛⠿⣦⠀⢄⠈⠛⢧⡷⢆⡙⣿⣿⣿⣿⣶⣤⣀⠉⠉⠉⠀⠈⠀⣠⠋⡴⠁⠀⠀⡄⣿⣿⠘⣿⡄",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⡄⠀⠉⠁⠀⠙⣦⠀⠂⠑⠀⠉⠀⠀⠉⢻⠓⡄⠈⠹⣿⣿⣿⣿⣤⠀⠀⠐⠉⠀⢠⠁⠀⠀⠀⡇⢸⣿⡟⢱⢸⣿⡆",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⣄⠀⠀⠀⠀⠀⠀⠀⠑⠂⠀⠀⠀⠀⠀⠀⢿⣿⣷⡽⡢⠙⢿⣿⣿⣶⣤⣀⠀⠬⣀⣀⣠⠔⢁⣾⣿⠇⡄⢿⢀⡏",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠦⣄⡀⠉⠓⣭⣿⣷⣶⣾⣿⣟⣛⣀⣀⣀⣠⡌⠙⠻⣦⣤⠙⠛⠿⣶⣭⣛⡿⠿⠿⠿⠟⣫⣾⠁⣼⡿⡇",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠓⠦⣀⠀⠉⠉⠉⠀⠀⠉⠉⠍⠀⠀⣀⣤⠴⠉⠛⠂⢿⣷⣦⣌⠛⠻⠿⠿⠿⠷⠙⠛⣴⣿⣷⡇",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠙⠛⠒⠲⠒⠶⠒⠛⠋⠉⠁⠀⠀⠀⠀⠀⠀⠈⠙⠻⢿⣿⣶⣶⣶⣶⣶⡿⣿⡿⠋",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠙⠛⠛⠛⠉⠁",
];

function visibleLen(line: string): number {
	return [...line].length;
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;

		// Clear the terminal (viewport + scrollback when supported) before the banner paints.
		try {
			process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
		} catch {
			// ignore
		}

		setTimeout(() => {
			ctx.ui.setHeader((_tui, _theme) => ({
				invalidate() {},
				dispose() {},
				render(width: number): string[] {
					const content = PLANET_LOGO.map((line) => line.replace(/⠀+$/u, "").replace(/ +$/u, ""));
					const logoWidth = Math.max(...content.map(visibleLen), 1);
					const pad = Math.max(0, Math.floor((width - logoWidth) / 2));
					const indent = " ".repeat(pad);
					return ["", ...content.map((line) => indent + PURPLE(line)), ""];
				},
			}));
		}, 100);
	});
}
