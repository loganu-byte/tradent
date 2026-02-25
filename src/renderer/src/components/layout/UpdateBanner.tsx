import { ExternalLink, X } from 'lucide-react'
import { useAppStore } from '../../store'

export function UpdateBanner(): React.JSX.Element | null {
  const updateInfo = useAppStore((s) => s.updateInfo)
  const dismissUpdate = useAppStore((s) => s.dismissUpdate)

  if (!updateInfo) return null

  const handleViewRelease = (): void => {
    window.api?.openReleaseUrl(updateInfo.releaseUrl)
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
      <p className="text-xs text-amber-300">
        <span className="font-medium">Tradent v{updateInfo.latestVersion}</span> is available.{' '}
        You are on v{updateInfo.currentVersion}.
      </p>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <button
          onClick={handleViewRelease}
          className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 transition-colors"
        >
          <ExternalLink size={11} />
          View release
        </button>
        <button
          onClick={dismissUpdate}
          className="text-amber-600 hover:text-amber-400 transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
