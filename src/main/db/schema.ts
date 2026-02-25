export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    level     TEXT    NOT NULL CHECK(level IN ('info', 'warn', 'error', 'debug', 'trade', 'agent')),
    source    TEXT    NOT NULL,
    message   TEXT    NOT NULL,
    metadata  TEXT
  );

  CREATE TABLE IF NOT EXISTS positions (
    id          TEXT    PRIMARY KEY,
    instrument  TEXT    NOT NULL,
    side        TEXT    NOT NULL CHECK(side IN ('long', 'short')),
    units       REAL    NOT NULL,
    open_price  REAL    NOT NULL,
    open_time   TEXT    NOT NULL,
    stop_loss   REAL,
    take_profit REAL,
    agent_id    TEXT    NOT NULL,
    reasoning   TEXT,
    status      TEXT    NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
    close_price REAL,
    close_time  TEXT,
    realized_pl REAL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    role      TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content   TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_logs_level     ON logs(level);
  CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);

  CREATE TABLE IF NOT EXISTS agents (
    id              TEXT    PRIMARY KEY,
    name            TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'idle' CHECK(status IN ('active','idle','stopped')),
    model           TEXT    NOT NULL DEFAULT 'gemini-pro',
    role_desc       TEXT    NOT NULL DEFAULT '',
    system_prompt   TEXT    NOT NULL DEFAULT '',
    strategy_prompt TEXT    NOT NULL DEFAULT '',
    enabled         INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE IF NOT EXISTS sub_agents (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id  TEXT    NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    type      TEXT    NOT NULL CHECK(type IN ('risk_manager','news_scanner','technical_analyst','sentiment_analyzer')),
    enabled   INTEGER NOT NULL DEFAULT 0,
    prompt    TEXT    NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS telegram_config (
    id                    INTEGER PRIMARY KEY CHECK(id = 1),
    chat_id               TEXT    NOT NULL DEFAULT '',
    enabled               INTEGER NOT NULL DEFAULT 0,
    notify_trade_opened   INTEGER NOT NULL DEFAULT 1,
    notify_trade_closed   INTEGER NOT NULL DEFAULT 1,
    notify_daily_summary  INTEGER NOT NULL DEFAULT 1,
    notify_agent_stopped  INTEGER NOT NULL DEFAULT 1,
    notify_loss_limit     INTEGER NOT NULL DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_sub_agents_agent_id ON sub_agents(agent_id);

  CREATE TABLE IF NOT EXISTS scheduled_messages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id    TEXT    NOT NULL DEFAULT 'default',
    scheduled_at TEXT    NOT NULL,
    message      TEXT    NOT NULL,
    status       TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','cancelled')),
    created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
`

export const MIGRATIONS = [
  "ALTER TABLE agents ADD COLUMN brokerage TEXT NOT NULL DEFAULT 'oanda'",
  "ALTER TABLE agents ADD COLUMN account_number TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE agents ADD COLUMN brokerage_environment TEXT NOT NULL DEFAULT 'practice'",
  // Sub-agent extended fields
  "ALTER TABLE sub_agents ADD COLUMN name TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE sub_agents ADD COLUMN role_desc TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE sub_agents ADD COLUMN model TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE sub_agents ADD COLUMN system_prompt TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE sub_agents ADD COLUMN strategy_prompt TEXT NOT NULL DEFAULT ''",
  // Telegram custom notification
  "ALTER TABLE telegram_config ADD COLUMN notify_custom INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE telegram_config ADD COLUMN custom_notification_text TEXT NOT NULL DEFAULT ''"
]
