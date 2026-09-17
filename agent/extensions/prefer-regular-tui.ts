import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * gentle-pi's install/update writes tuiMode: "fullscreen" into settings.json.
 * Keep our preference: regular mode (bottom status bar, no Status rail).
 */
const SETTINGS = join(homedir(), ".pi", "agent", "settings.json");

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    try {
      const raw = readFileSync(SETTINGS, "utf8");
      const data = JSON.parse(raw) as Record<string, unknown>;
      if (data.tuiMode !== "fullscreen") return;

      data.tuiMode = "regular";
      writeFileSync(SETTINGS, `${JSON.stringify(data, null, 2)}\n`);
      if (ctx.hasUI) {
        ctx.ui.notify(
          "tuiMode was reset to regular (gentle-pi update forces fullscreen). Restart PI once for the bar layout.",
          "warning",
        );
      }
    } catch {
      // ignore — never block startup
    }
  });
}
