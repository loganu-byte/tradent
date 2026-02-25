import { ipcMain, shell, app } from 'electron'
import type { BrowserWindow } from 'electron'
import * as https from 'https'

const GITHUB_REPO = 'loganu-byte/tradent'

interface GitHubRelease {
  tag_name: string
  html_url: string
  body: string
}

// Track whether the IPC handler has been registered (only register once)
let handlerRegistered = false

function semverGt(a: string, b: string): boolean {
  const parse = (v: string): number[] =>
    v.replace(/^v/, '').split('.').map(Number)
  const [aMaj, aMin, aPatch] = parse(a)
  const [bMaj, bMin, bPatch] = parse(b)
  if (aMaj !== bMaj) return aMaj > bMaj
  if (aMin !== bMin) return aMin > bMin
  return aPatch > bPatch
}

function fetchLatestRelease(): Promise<GitHubRelease | null> {
  return new Promise((resolve) => {
    const req = https.get(
      {
        hostname: 'api.github.com',
        path: `/repos/${GITHUB_REPO}/releases/latest`,
        headers: {
          'User-Agent': `Tradent/${app.getVersion()}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      },
      (res) => {
        let data = ''
        res.on('data', (chunk: string) => { data += chunk })
        res.on('end', () => {
          try {
            const json = JSON.parse(data) as Partial<GitHubRelease>
            if (json.tag_name) {
              resolve({
                tag_name: json.tag_name,
                html_url: json.html_url ?? '',
                body: json.body ?? ''
              })
            } else {
              resolve(null)
            }
          } catch {
            resolve(null)
          }
        })
      }
    )
    req.on('error', () => resolve(null))
    req.setTimeout(8000, () => { req.destroy(); resolve(null) })
  })
}

export function checkForUpdates(mainWindow: BrowserWindow): void {
  if (!handlerRegistered) {
    ipcMain.handle('update:open-release', (_event, url: string) => {
      shell.openExternal(url)
    })
    handlerRegistered = true
  }

  setTimeout(async () => {
    try {
      const release = await fetchLatestRelease()
      if (!release) return

      const currentVersion = app.getVersion()
      const latestVersion = release.tag_name.replace(/^v/, '')
      if (!semverGt(latestVersion, currentVersion)) return

      if (mainWindow.isDestroyed()) return
      mainWindow.webContents.send('update:available', {
        currentVersion,
        latestVersion,
        releaseUrl: release.html_url,
        releaseNotes: release.body
      })
    } catch {
      // Silently ignore — never crash or show an error to the user
    }
  }, 3000)
}
