# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup (native module requires these steps due to Electron ABI)
npm install --ignore-scripts          # Install packages, skip native compile
node node_modules/electron/install.js # Download Electron binary (skipped above)
npm run rebuild                       # Rebuild better-sqlite3 for the Electron runtime

npm run dev        # Start Electron app in development mode
npm run build      # Build all three processes (main, preload, renderer)
npm run preview    # Preview the production build
npm run package    # Build + package into distributable (dmg/exe/AppImage)
```

> **Why `--ignore-scripts`?** `better-sqlite3` is a native module. Running plain `npm install` tries to compile it against system Node, which fails with newer Node versions. `npm run rebuild` uses `electron-builder install-app-deps` to download the prebuilt binary compiled for the exact Electron version instead.

## Architecture

Tradent is an Electron + React + Node.js desktop app with three processes:

- **Main process** (`src/main/`) — Node.js. Runs the trading agent, owns SQLite, handles all IPC, calls broker/AI APIs directly.
- **Preload** (`src/preload/index.ts`) — Sandboxed bridge. Exposes a typed `window.api` to the renderer via `contextBridge`. Nothing else crosses the boundary.
- **Renderer** (`src/renderer/`) — React + Vite. All external calls go through `window.api` IPC — never direct Node.js or network access.

### Main Process Layout

```
src/main/
  index.ts                  # App entry: BrowserWindow, DB init, IPC registration
  db/
    schema.ts               # SQLite table definitions (logs, positions, chat_messages, settings)
    index.ts                # DB connection + initDatabase()
  ipc/
    index.ts                # Registers all IPC handlers
    agent.ts / broker.ts / chat.ts / logs.ts / settings.ts
  agent/
    index.ts                # TradingAgent class (start/stop/log/broadcastStatus)
    providers/              # AI provider integrations (gemini, openai, anthropic, openrouter)
    broker/oanda.ts         # OANDA REST API client
  store/
    settings.ts             # electron-store encrypted storage for API keys + OANDA credentials
```

### Renderer Layout

```
src/renderer/src/
  types/index.ts            # All shared TS interfaces (LogEntry, Position, ChatMessage, etc.)
  store/index.ts            # Zustand global state
  App.tsx                   # MemoryRouter + route definitions
  env.d.ts                  # Declares window.api type
  components/
    layout/                 # Sidebar, TitleBar
    dashboard/              # Dashboard
    logs/                   # LiveLogs
    positions/              # OpenPositions
    chat/                   # Chat
    settings/               # Settings
  hooks/useTheme.ts         # Applies dark/light/system class to <html>
```

### Routes
`/dashboard` → `/logs` → `/positions` → `/chat` → `/settings`

### Data Flow
1. IPC handlers in main read SQLite or call external APIs
2. Pushed events (new logs, position updates) use `BrowserWindow.webContents.send()`
3. Renderer subscribes via `window.api.onNewLog()` etc., updates Zustand store
4. Components read from Zustand store — no direct IPC calls in render

### Security
- `contextIsolation: true`, `nodeIntegration: false` on all BrowserWindows
- API keys live in encrypted `electron-store` on the main process — never sent from renderer
- Renderer has zero access to Node.js or filesystem

### Build
- `electron-vite` bundles all three processes; `externalizeDepsPlugin()` externalizes `dependencies` from main/preload
- `better-sqlite3` is a native module rebuilt for Electron via `postinstall` (`electron-builder install-app-deps`)
- `electron-builder` packages the final distributable

## Phase 1 Scope

Local only — no cloud backend. OANDA demo/live accounts, Gemini AI for trading decisions, live logs, open positions, basic chat.

See product vision for full roadmap (Phases 2–6 cover full feature set, open source release, cloud backend, additional brokers, Docker).
