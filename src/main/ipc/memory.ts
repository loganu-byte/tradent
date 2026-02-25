import { ipcMain, app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs'

function ensureDirs(memoryDir: string, threadsDir: string): void {
  if (!existsSync(memoryDir)) mkdirSync(memoryDir, { recursive: true })
  if (!existsSync(threadsDir)) mkdirSync(threadsDir, { recursive: true })
}

export function registerMemoryHandlers(): void {
  ipcMain.handle('memory:read-permanent', () => {
    const memoryDir = join(app.getPath('userData'), 'memory')
    const threadsDir = join(memoryDir, 'threads')
    ensureDirs(memoryDir, threadsDir)
    const filePath = join(memoryDir, 'permanent.md')
    const content = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : ''
    return { content, path: filePath }
  })

  ipcMain.handle('memory:write-permanent', (_event, content: string) => {
    const memoryDir = join(app.getPath('userData'), 'memory')
    const threadsDir = join(memoryDir, 'threads')
    ensureDirs(memoryDir, threadsDir)
    writeFileSync(join(memoryDir, 'permanent.md'), content, 'utf-8')
    return { success: true }
  })

  ipcMain.handle('memory:list-threads', () => {
    const memoryDir = join(app.getPath('userData'), 'memory')
    const threadsDir = join(memoryDir, 'threads')
    ensureDirs(memoryDir, threadsDir)
    const ids = readdirSync(threadsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
    return { ids, count: ids.length }
  })

  ipcMain.handle('memory:clear-threads', () => {
    const memoryDir = join(app.getPath('userData'), 'memory')
    const threadsDir = join(memoryDir, 'threads')
    ensureDirs(memoryDir, threadsDir)
    const files = readdirSync(threadsDir).filter((f) => f.endsWith('.md'))
    for (const f of files) {
      unlinkSync(join(threadsDir, f))
    }
    return { success: true, count: files.length }
  })
}
