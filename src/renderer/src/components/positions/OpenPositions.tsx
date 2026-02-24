import { useEffect } from 'react'
import { useAppStore } from '../../store'

export function OpenPositions(): React.JSX.Element {
  const positions = useAppStore((s) => s.positions)

  useEffect(() => {
    // TODO: Load and poll positions from OANDA via IPC
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
        <h1 className="text-sm font-semibold text-neutral-100">Open Positions</h1>
        <span className="text-xs text-neutral-600">{positions.length} open</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {positions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-700 text-sm">
            No open positions
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-neutral-950">
              <tr className="text-neutral-600 border-b border-neutral-800">
                {['Instrument', 'Side', 'Units', 'Open Price', 'P&L', 'SL', 'TP', 'Open Time'].map(
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
                  <td className="px-4 py-2.5 text-neutral-300 font-mono">{pos.units}</td>
                  <td className="px-4 py-2.5 text-neutral-300 font-mono">{pos.open_price}</td>
                  <td className="px-4 py-2.5 font-mono text-neutral-500">—</td>
                  <td className="px-4 py-2.5 text-neutral-500 font-mono">
                    {pos.stop_loss ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500 font-mono">
                    {pos.take_profit ?? '—'}
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
