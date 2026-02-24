import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ScrollText,
  TrendingUp,
  MessageSquare,
  Settings
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/logs', icon: ScrollText, label: 'Live Logs' },
  { to: '/positions', icon: TrendingUp, label: 'Open Positions' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/settings', icon: Settings, label: 'Settings' }
] as const

export function Sidebar(): React.JSX.Element {
  return (
    <aside className="w-14 flex flex-col items-center py-3 gap-1 bg-neutral-900 border-r border-neutral-800 shrink-0">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            clsx(
              'w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-100',
              isActive
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800'
            )
          }
        >
          <Icon size={17} strokeWidth={1.75} />
        </NavLink>
      ))}
    </aside>
  )
}
