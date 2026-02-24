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
`
