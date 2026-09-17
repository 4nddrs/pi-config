#!/usr/bin/env bash
# Install this Pi setup on a new macOS or Linux machine.
# Usage:
#   git clone <repo> ~/.pi && ~/.pi/install.sh
#   ./install.sh              # from any checkout; syncs into ~/.pi
set -euo pipefail

PI_VERSION="0.85.1"
ENGRAM_VERSION="1.20.0"
NODE_MIN_MAJOR="22"
DEST="${HOME}/.pi"
LOCAL_BIN="${HOME}/.local/bin"
NPM_USER_PREFIX="${HOME}/.npm-global"
ENGRAM_RELEASE="https://github.com/Gentleman-Programming/engram/releases/download/v${ENGRAM_VERSION}"

PI_NPM_PACKAGES=(
  "npm:gentle-engram@0.1.12"
  "npm:@coresofthq/pi-litellm-autorouter@1.2.1"
  "npm:gentle-pi@3.2.0"
  "npm:pi-mcp-adapter@2.34.0"
)

FORCE=0

usage() {
  cat <<EOF
Install Pi ${PI_VERSION}, Engram ${ENGRAM_VERSION}, and this ~/.pi config.

Usage: $(basename "$0") [--force] [--help]

  --force   Reinstall Engram and Pi even if the pinned versions are present
  --help    Show this help

Does not copy Engram memory (~/.engram) or chat sessions.
EOF
}

log() { printf '==> %s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

[[ -n "${BASH_SOURCE[0]-}" ]] || die "run this file directly, not via a pipe"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

OS="$(uname -s)"
ARCH_RAW="$(uname -m)"
case "$ARCH_RAW" in
  x86_64|amd64) ARCH=amd64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) die "unsupported architecture: ${ARCH_RAW}" ;;
esac
case "$OS" in
  Darwin) OS_KEY=darwin ;;
  Linux) OS_KEY=linux ;;
  *) die "unsupported OS: ${OS} (macOS and Linux only)" ;;
esac

prepend_path() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0
  case ":${PATH}:" in
    *":${dir}:"*) ;;
    *) export PATH="${dir}:${PATH}" ;;
  esac
}

persist_path() {
  local dir="$1"
  local line="export PATH=\"${dir}:\$PATH\""
  local rc=""
  mkdir -p "$dir"
  prepend_path "$dir"
  case "${SHELL##*/}" in
    zsh) rc="${HOME}/.zshrc" ;;
    bash) rc="${HOME}/.bashrc" ;;
    *) rc="${HOME}/.profile" ;;
  esac
  [[ -f "$rc" ]] || touch "$rc"
  if grep -Fqs "$dir" "$rc"; then
    return 0
  fi
  printf '\n# Pi setup\n%s\n' "$line" >>"$rc"
  log "added ${dir} to PATH in ${rc}"
}

node_major() {
  node -v 2>/dev/null | sed -n 's/^v\([0-9][0-9]*\).*/\1/p'
}

ensure_linux_packages() {
  local missing=()
  local pkg
  for pkg in git rsync curl tar; do
    have "$pkg" || missing+=("$pkg")
  done
  [[ ${#missing[@]} -eq 0 ]] && return 0

  log "installing Linux packages: ${missing[*]}"
  if have apt-get; then
    sudo apt-get update -y
    sudo apt-get install -y "${missing[@]}" ca-certificates
  elif have dnf; then
    sudo dnf install -y "${missing[@]}"
  elif have pacman; then
    sudo pacman -Sy --noconfirm "${missing[@]}"
  elif have zypper; then
    sudo zypper install -y "${missing[@]}"
  else
    die "missing ${missing[*]} and no known package manager. Install them and re-run."
  fi
}

ensure_macos_packages() {
  local pkg
  for pkg in git rsync curl; do
    have "$pkg" || {
      have brew || die "missing ${pkg} and Homebrew is not installed (https://brew.sh)"
      log "installing ${pkg} with Homebrew"
      brew install "$pkg"
    }
  done
}

ensure_node() {
  if have npm; then
    prepend_path "$(npm prefix -g)/bin"
  fi
  prepend_path "${NPM_USER_PREFIX}/bin"
  local major
  major="$(node_major || true)"
  if have node && [[ -n "$major" && "$major" -ge "$NODE_MIN_MAJOR" ]]; then
    log "Node $(node -v) OK"
    return 0
  fi
  if [[ "$OS" == Darwin ]]; then
    have brew || die "Node ${NODE_MIN_MAJOR}+ is required. Install Homebrew (https://brew.sh) or Node, then re-run."
    log "installing Node with Homebrew"
    brew install node
    major="$(node_major || true)"
    have node && [[ -n "$major" && "$major" -ge "$NODE_MIN_MAJOR" ]] && return 0
  fi
  die "Node ${NODE_MIN_MAJOR}+ is required (found $(node -v 2>/dev/null || echo none)). On Linux use nvm/fnm, not the distro nodejs package."
}

sync_config() {
  mkdir -p "$DEST"
  if [[ "$SCRIPT_DIR" == "$DEST" ]]; then
    log "already in ${DEST}; skipping file sync"
    return 0
  fi
  have rsync || die "rsync is required"
  log "syncing config ${SCRIPT_DIR} -> ${DEST}"
  rsync -a \
    --exclude '.git/' \
    --exclude 'agent/auth.json' \
    --exclude 'agent/sessions/' \
    --exclude 'agent/npm/' \
    --exclude 'agent/models-store.json' \
    --exclude 'agent/mcp-cache.json' \
    --exclude 'agent/gentle-ai/managed-assets.json' \
    --exclude 'agent/.atl/' \
    --exclude 'agent/tmp/' \
    --exclude 'agent/pi-pretty/' \
    --exclude 'agent/gentle-agents/' \
    --exclude 'agent/trust.json' \
    --exclude 'agent/extensions/_pi-status-widget.disabled/' \
    --exclude '.DS_Store' \
    "${SCRIPT_DIR}/" "${DEST}/"
  if [[ -d "${SCRIPT_DIR}/.git" && ! -d "${DEST}/.git" ]]; then
    rsync -a "${SCRIPT_DIR}/.git/" "${DEST}/.git/"
  fi
}

install_pi_cli() {
  prepend_path "$(npm prefix -g)/bin"
  prepend_path "${NPM_USER_PREFIX}/bin"
  if [[ "$FORCE" -eq 0 ]] && have pi && pi --version 2>/dev/null | grep -Fq "$PI_VERSION"; then
    log "Pi ${PI_VERSION} already installed"
    return 0
  fi
  log "installing @earendil-works/pi-coding-agent@${PI_VERSION}"
  if npm install -g --ignore-scripts "@earendil-works/pi-coding-agent@${PI_VERSION}"; then
    prepend_path "$(npm prefix -g)/bin"
  else
    log "retrying Pi install with a user npm prefix"
    mkdir -p "${NPM_USER_PREFIX}"
    npm_config_prefix="${NPM_USER_PREFIX}" npm install -g --ignore-scripts \
      "@earendil-works/pi-coding-agent@${PI_VERSION}"
    persist_path "${NPM_USER_PREFIX}/bin"
  fi
  have pi || die "pi was installed but is not on PATH"
  log "Pi $(pi --version)"
}

sha256_file() {
  if have sha256sum; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

install_engram() {
  persist_path "$LOCAL_BIN"
  prepend_path "/opt/homebrew/bin"
  prepend_path "/usr/local/bin"
  if [[ "$FORCE" -eq 0 ]] && have engram && engram version 2>/dev/null | grep -Fq "$ENGRAM_VERSION"; then
    log "Engram ${ENGRAM_VERSION} already installed ($(command -v engram))"
    return 0
  fi

  local asset="engram_${ENGRAM_VERSION}_${OS_KEY}_${ARCH}.tar.gz"
  local tmp
  tmp="$(mktemp -d)"
  log "downloading Engram ${ENGRAM_VERSION} (${asset})"
  curl -fsSL -o "${tmp}/${asset}" "${ENGRAM_RELEASE}/${asset}"
  curl -fsSL -o "${tmp}/checksums.txt" "${ENGRAM_RELEASE}/checksums.txt"
  local expected
  expected="$(awk -v f="$asset" '$2 == f || $2 == "*"f { print $1; exit }' "${tmp}/checksums.txt")"
  [[ -n "$expected" ]] || die "no checksum for ${asset} in checksums.txt"
  local actual
  actual="$(sha256_file "${tmp}/${asset}")"
  [[ "$actual" == "$expected" ]] || die "Engram checksum mismatch (expected ${expected}, got ${actual})"

  tar -xzf "${tmp}/${asset}" -C "$tmp"
  local bin="${tmp}/engram"
  if [[ ! -f "$bin" ]]; then
    bin="$(find "$tmp" -type f -name engram -print -quit)"
  fi
  [[ -n "$bin" && -f "$bin" ]] || die "engram binary not found in ${asset}"
  mkdir -p "$LOCAL_BIN"
  cp "$bin" "${LOCAL_BIN}/engram"
  chmod 755 "${LOCAL_BIN}/engram"
  prepend_path "$LOCAL_BIN"
  rm -rf "$tmp"
  engram version 2>/dev/null | grep -Fq "$ENGRAM_VERSION" || die "engram did not report ${ENGRAM_VERSION}"
  log "Engram $(engram version) -> ${LOCAL_BIN}/engram"
}

keep_regular_tui() {
  local settings="${DEST}/agent/settings.json"
  [[ -f "$settings" ]] || return 0
  node -e '
    const fs = require("fs");
    const p = process.argv[1];
    const s = JSON.parse(fs.readFileSync(p, "utf8"));
    s.tuiMode = "regular";
    s.quietStartup = true;
    fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
  ' "$settings"
}

install_pi_packages() {
  have pi || die "pi CLI missing"
  local pkg
  for pkg in "${PI_NPM_PACKAGES[@]}"; do
    log "pi install ${pkg}"
    pi install "$pkg"
  done
  keep_regular_tui
}

sync_gentle_ai() {
  local bin=""
  if have gentle-ai; then
    bin="$(command -v gentle-ai)"
  else
    local candidate
    for candidate in "${DEST}"/agent/npm/node_modules/gentle-pi/.gentle-ai/*/gentle-ai; do
      [[ -x "$candidate" ]] && bin="$candidate" && break
    done
  fi
  if [[ -z "$bin" ]]; then
    warn "gentle-ai binary not found yet; start Pi once, then run: gentle-ai sync"
    return 0
  fi
  log "gentle-ai sync (${bin})"
  "$bin" sync || warn "gentle-ai sync failed; start Pi once, then run: gentle-ai sync"
}

print_summary() {
  cat <<EOF

Pi setup is in ${DEST}
  pi:     $(command -v pi || echo missing)
  engram: $(command -v engram || echo missing)

Next: run  pi
Then /login and pick OpenCode Go.
EOF
}

log "OS=${OS_KEY} arch=${ARCH}"
if [[ "$OS" == Linux ]]; then
  ensure_linux_packages
else
  ensure_macos_packages
fi
ensure_node
sync_config
install_pi_cli
install_engram
install_pi_packages
sync_gentle_ai
print_summary
