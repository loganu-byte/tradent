import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { SCHEMA, MIGRATIONS } from './schema'

let db: Database.Database

export function initDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'tradent.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  for (const sql of MIGRATIONS) {
    try { db.exec(sql) } catch { /* column already exists */ }
  }
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized — call initDatabase() first')
  return db
}
