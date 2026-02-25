#!/usr/bin/env bash
# Tradent one-liner installer
# Usage: curl -fsSL https://raw.githubusercontent.com/loganu-byte/tradent/main/install.sh | bash

set -uo pipefail

# ── Colours ────────────────────────────────────────────────────────────────────
RESET='\033[0m'
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'

info()    { echo -e "${BLUE}${BOLD}==>  ${RESET}${BOLD}$*${RESET}"; }
success() { echo -e "${GREEN}${BOLD} ✓  ${RESET}$*"; }
warn()    { echo -e "${YELLOW}${BOLD} !  ${RESET}$*"; }
die()     { echo -e "${RED}${BOLD} ✗  ERROR: ${RESET}$*" >&2; exit 1; }

# ── OS detection ───────────────────────────────────────────────────────────────
detect_os() {
  if [[ "${OSTYPE:-}" == "darwin"* ]]; then
    echo "macos"
  elif [[ -f /proc/version ]] && grep -qi microsoft /proc/version 2>/dev/null; then
    echo "wsl"
  elif [[ "${OSTYPE:-}" == "linux"* ]] || [[ "$(uname -s 2>/dev/null)" == "Linux" ]]; then
    echo "linux"
  else
    echo "unknown"
  fi
}

OS=$(detect_os)
info "Detected OS: ${OS}"

# ── Node.js 18+ check / install ────────────────────────────────────────────────
node_ok() {
  command -v node &>/dev/null || return 1
  local major
  major=$(node -e "console.log(parseInt(process.versions.node))" 2>/dev/null) || return 1
  [[ "$major" -ge 18 ]]
}

if node_ok; then
  success "Node.js $(node -v) found"
else
  warn "Node.js 18+ not found — installing..."
  case "$OS" in
    macos)
      if command -v brew &>/dev/null; then
        info "Installing Node.js via Homebrew..."
        brew install node || die "Homebrew node install failed."
      else
        die "Homebrew not found. Install it from https://brew.sh then re-run this script."
      fi
      ;;
    linux|wsl)
      info "Installing Node.js 20 LTS via NodeSource..."
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - \
        || die "NodeSource setup failed."
      sudo apt-get install -y nodejs || die "apt install nodejs failed."
      ;;
    *)
      die "Unsupported OS (${OSTYPE:-unknown}). Install Node.js 18+ from https://nodejs.org then re-run."
      ;;
  esac
  node_ok || die "Node.js installation failed. Install Node.js 18+ from https://nodejs.org and re-run."
  success "Node.js $(node -v) installed"
fi

command -v npm &>/dev/null || die "npm not found after Node.js install."
success "npm $(npm -v) found"

command -v git &>/dev/null || die "git not found. Please install git and re-run."

# ── Clone or pull repo ─────────────────────────────────────────────────────────
REPO_URL="https://github.com/loganu-byte/tradent"
REPO_DIR="tradent"

if [[ -d "${REPO_DIR}/.git" ]]; then
  warn "Repository already exists — pulling latest changes..."
  git -C "$REPO_DIR" pull || die "git pull failed."
else
  info "Cloning Tradent repository..."
  git clone "$REPO_URL" || die "git clone failed. Check your internet connection."
fi
success "Repository ready"

cd "$REPO_DIR"

# ── Install dependencies ───────────────────────────────────────────────────────
info "Installing npm dependencies (this may take a minute)..."
npm install --ignore-scripts || die "npm install failed."
success "Dependencies installed"

info "Downloading Electron binary..."
node node_modules/electron/install.js || die "Electron download failed."
success "Electron binary ready"

info "Rebuilding native modules for Electron..."
npm run rebuild || die "Native module rebuild failed."
success "Native modules built"

# ── Launch ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${CYAN}${BOLD}  Tradent is ready — launching now${RESET}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  To launch again:  ${YELLOW}${BOLD}cd tradent && npm run dev${RESET}"
echo ""
npm run dev
