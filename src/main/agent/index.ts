import { BrowserWindow } from 'electron'
import { getDb } from '../db'
import type Database from 'better-sqlite3'

export class TradingAgent {
  isRunning = false
  private loopInterval: NodeJS.Timeout | null = null
  private insertLog: Database.Statement | null = null

  async start(): Promise<void> {
    const db = getDb()
    this.insertLog = db.prepare(
      'INSERT INTO logs (level, source, message, metadata) VALUES (?, ?, ?, ?)'
    )

    this.isRunning = true
    this.log('info', 'agent', 'Trading agent started')
    this.broadcastStatus()

    // TODO: Initialize AI provider from settings, begin trading loop
    // this.loopInterval = setInterval(() => this.tick(), 60_000)
  }

  async stop(): Promise<void> {
    if (this.loopInterval) {
      clearInterval(this.loopInterval)
      this.loopInterval = null
    }
    this.isRunning = false
    this.log('info', 'agent', 'Trading agent stopped')
    this.broadcastStatus()
  }

  log(level: string, source: string, message: string, metadata?: unknown): void {
    try {
      const result = this.insertLog!.run(
        level,
        source,
        message,
        metadata !== undefined ? JSON.stringify(metadata) : null
      )
      const entry = {
        id: result.lastInsertRowid,
        timestamp: new Date().toISOString(),
        level,
        source,
        message,
        metadata
      }
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send('logs:new', entry)
      }
    } catch (err) {
      console.error('[TradingAgent] Failed to write log:', err)
    }
  }

  private broadcastStatus(): void {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('agent:status', { isRunning: this.isRunning })
    }
  }
}
