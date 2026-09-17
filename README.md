# Pi setup

Config for `~/.pi`. Clone it, install Pi + Engram, run `pi`, then `/login`.

Not in this repo: chat sessions, Engram memory (`~/.engram`).

## Install

```bash
git clone https://github.com/4nddrs/pi-config ~/.pi
~/.pi/install.sh
```

If `~/.pi` already exists, clone anywhere and run `./install.sh` from that checkout.

```bash
pi
```

In Pi, run `/login` and pick OpenCode Go. Packages come from `settings.json` on first launch.

## Without the script

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@0.85.1
git clone https://github.com/4nddrs/pi-config ~/.pi
```

Engram — macOS:

```bash
brew install gentleman-programming/tap/engram
```

Engram — Linux: download `engram_1.20.0_linux_amd64.tar.gz` (or `arm64`) from [Engram releases](https://github.com/Gentleman-Programming/engram/releases/tag/v1.20.0), put `engram` on your `PATH`.

```bash
pi
```

Then `/login`.
