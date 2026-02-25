# Tradent

An autonomous AI-powered forex trading agent built with Electron, React, and SQLite. Runs entirely on your machine — no cloud required.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/loganu-byte/tradent/main/install.sh | bash
```

Supports macOS, Linux, and Windows (WSL). Requires Node.js 18+ and git — the script will install Node.js if missing.

---

## What is Tradent?

Tradent lets you define a trading strategy in plain English, connect it to a real brokerage account, and let an LLM-powered agent execute it autonomously. You stay in control via a local desktop UI, a chat interface, and Telegram alerts.

## Features

- **AI-powered trading** — Drives decisions through configurable LLM providers: Google Gemini, OpenAI, Anthropic, and OpenRouter
- **OANDA integration** — Connects to OANDA's REST API for live and practice account trading
- **Sub-agents** — Specialized assistants for risk management, technical analysis, news scanning, and sentiment analysis
- **Risk controls** — Daily loss limit with automatic agent shutdown and Telegram alerts
- **Telegram notifications** — Real-time trade alerts, daily summaries, custom triggers, and loss limit warnings
- **Chat interface** — Converse with your agent directly; type `/commands` for a full command list
- **Scheduled messages** — Queue instructions for future execution with `/schedule`
- **Permanent memory** — Agent retains strategic notes across sessions
- **Local-first** — SQLite database, OS-level keychain encryption for all API keys (macOS Keychain / Windows DPAPI / libsecret)
- **Remote access** — Optional Tailscale integration for secure remote access without exposing ports
- **In-app update notifications** — Notified when new versions are released on GitHub

## Manual Setup

Requirements: Node.js 18+, npm, git

```bash
git clone https://github.com/loganu-byte/tradent
cd tradent
npm install --ignore-scripts
node node_modules/electron/install.js
npm run rebuild
npm run dev
```

## Development

```bash
npm run dev        # Start in development mode (hot-reload)
npm run build      # Build all three processes (main, preload, renderer)
npm run package    # Build + package into a distributable
```

TypeScript must pass on both configs before committing:

```bash
npx tsc --noEmit --project tsconfig.node.json
npx tsc --noEmit --project tsconfig.web.json
```

## Configuration

On first launch, go to **Settings** to:

1. Enter API keys for at least one AI provider (Gemini, OpenAI, Anthropic, or OpenRouter)
2. Set the active provider and model
3. Optionally configure a daily loss limit

Then go to **Agents** to create your first trading agent with a brokerage connection.

## License

MIT
