import { TrendingUp } from 'lucide-react'
import { useAppStore } from '../../store'

export function OpenPositions(): React.JSX.Element {
  const positions = useAppStore((s) => s.positions)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
        <h1 className="text-sm font-semibold text-neutral-100">Open Positions</h1>
        {positions.length > 0 && (
          <span className="text-xs text-neutral-600 tabular-nums">{positions.length} open</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <TrendingUp size={32} className="text-neutral-800" />
            <div>
              <p className="text-sm text-neutral-500 mb-1">No open positions</p>
              <p className="text-xs text-neutral-700">
                Positions opened by the agent will appear here in real time.
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-neutral-950">
              <tr className="text-neutral-600 border-b border-neutral-800">
                {['Instrument', 'Side', 'Units', 'Open Price', 'P&L', 'Stop Loss', 'Take Profit', 'Opened'].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-2 font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr
                  key={pos.id}
                  className="border-b border-neutral-900 hover:bg-neutral-900 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono font-medium text-neutral-100">
                    {pos.instrument}
                  </td>
                  <td
                    className={`px-4 py-2.5 font-medium ${
                      pos.side === 'long' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {pos.side.toUpperCase()}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-300 font-mono">{pos.units.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-neutral-300 font-mono">{pos.open_price.toFixed(5)}</td>
                  <td className="px-4 py-2.5 font-mono text-neutral-600">—</td>
                  <td className="px-4 py-2.5 text-neutral-500 font-mono">
                    {pos.stop_loss != null ? pos.stop_loss.toFixed(5) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500 font-mono">
                    {pos.take_profit != null ? pos.take_profit.toFixed(5) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {new Date(pos.open_time).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
