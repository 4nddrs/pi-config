# Pi agent setup

Portable Pi coding-agent config for `~/.pi`. Clone this repo, install the CLI and Engram, then authenticate. Chat sessions and Engram memory are not included.

Pinned runtime: Pi `0.85.1`, `gentle-pi@3.2.0`, `gentle-engram@0.1.12`, `@coresofthq/pi-litellm-autorouter@1.2.1`, `pi-mcp-adapter@2.34.0`. Engram CLI: `1.20.0`.

Default model: `opencode-go/kimi-k2.6` (TUI regular, quiet startup).

## What this repo contains

- Global Pi settings, autorouter, and MCP config
- Local extensions (`pi-banner`, regular TUI, system-prompt append)
- Gentle-AI persona/banner
- Agent and chain markdown used by gentle-pi

## What this repo does not contain

- `agent/auth.json` (API keys)
- Chat sessions
- `node_modules` / installed Pi packages
- Engram memory (`~/.engram`)

## New machine

The installer handles macOS and Linux: Node check, Pi CLI, Engram `1.20.0`, config sync into `~/.pi`, and the pinned npm packages. It does not overwrite `auth.json`, sessions, or `~/.engram`.

```bash
git clone <this-repo-url> ~/.pi
chmod +x ~/.pi/install.sh
~/.pi/install.sh
```

If `~/.pi` already exists:

```bash
git clone <this-repo-url> /tmp/pi-setup
/tmp/pi-setup/install.sh
```

Then paste your OpenCode Go key into `~/.pi/agent/auth.json` if the script created it from the example, and run `pi`.

Manual steps below are the fallback if you do not want to use the script.

### 1. Prerequisites

- Node.js 22+ and npm (do not use distro Node from `apt` if it is older than 22)
- Git and `rsync`
- `engram` on `PATH` (see OS sections below)

Confirm:

```bash
node -v    # v22+
npm -v
git --version
command -v rsync
```

### 2. Install Pi

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@0.85.1
command -v pi
```

If `pi` is not found, add npm's global bin to `PATH` (common on Linux):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
# persist that line in ~/.bashrc or ~/.zshrc
```

### 3. Clone into `~/.pi`

If `~/.pi` does not exist yet:

```bash
git clone <this-repo-url> ~/.pi
```

If Pi already created `~/.pi`:

```bash
git clone <this-repo-url> /tmp/pi-setup
rsync -a --exclude '.git' /tmp/pi-setup/ ~/.pi/
```

Then copy your API key:

```bash
cp ~/.pi/agent/auth.json.example ~/.pi/agent/auth.json
# edit auth.json and paste the OpenCode Go key
chmod 600 ~/.pi/agent/auth.json
```

Or start `pi` and authenticate interactively instead of copying the file.

### 4. First launch

```bash
pi
```

Pi installs the npm packages listed in `agent/settings.json`. After that:

```bash
gentle-ai sync
command -v engram
```

Memory starts empty on the new machine; this repo does not sync `~/.engram`.

## macOS (Engram)

```bash
brew install gentleman-programming/tap/engram
engram version    # 1.20.0
```

`mcp.json` calls `engram` from `PATH` (`/opt/homebrew/bin` on Apple Silicon, `/usr/local/bin` on Intel).

## Linux

Works on modern amd64 or arm64 distros (Ubuntu, Debian, Fedora, Arch, etc.). `mcp.json` already uses `command: "engram"`, so Homebrew vs a manual binary does not matter as long as `engram` is on `PATH`.

### Node.js

Use Node 22+ from [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), or the official Node packages — not the default Ubuntu `nodejs` package if it is outdated.

```bash
# Debian/Ubuntu helpers for clone/rsync
sudo apt update
sudo apt install -y git rsync curl ca-certificates
```

```bash
# Fedora
sudo dnf install -y git rsync curl
```

If a global `npm install -g` puts `pi` outside `PATH`, add `$(npm prefix -g)/bin` as shown in step 2.

### Engram (recommended: release binary)

Pin to `1.20.0`, matching this setup:

```bash
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)  ARCH=amd64 ;;
  aarch64|arm64) ARCH=arm64 ;;
  *) echo "unsupported arch: $ARCH" >&2; exit 1 ;;
esac

curl -fsSL -o /tmp/engram.tar.gz \
  "https://github.com/Gentleman-Programming/engram/releases/download/v1.20.0/engram_1.20.0_linux_${ARCH}.tar.gz"
tar -xzf /tmp/engram.tar.gz -C /tmp
chmod +x /tmp/engram
sudo mv /tmp/engram /usr/local/bin/engram
engram version    # 1.20.0
```

`install.sh` does this download (with checksum verification) and installs to `~/.local/bin`. Linuxbrew is also valid: `brew install gentleman-programming/tap/engram`.

### Then continue

Follow steps 2–4 above (Pi, clone into `~/.pi`, auth, `pi`, `gentle-ai sync`).

## This machine (source)

Keep `auth.json` out of git. After config changes:

```bash
git add .
git status   # confirm auth.json and sessions/ are not listed
git commit -m "Update Pi setup"
git push
```
