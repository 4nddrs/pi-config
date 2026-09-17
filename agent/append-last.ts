import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Re-appends ~/.pi/agent/APPEND_SYSTEM.md at the end of before_agent_start
 * chaining so it wins over packages like Engram without forking them.
 *
 * Kept at ~/.pi/agent/append-last.ts (not extensions/, not hooks/) and listed
 * last in settings.packages so it loads after Engram. Edit APPEND_SYSTEM.md only.
 */
const APPEND_PATH = join(homedir(), ".pi", "agent", "APPEND_SYSTEM.md");

function loadAppend(): string {
  try {
    return readFileSync(APPEND_PATH, "utf8").trim();
  } catch {
    return "";
  }
}

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    const append = loadAppend();
    if (!append) return;
    return { systemPrompt: `${event.systemPrompt}\n\n${append}` };
  });
}
