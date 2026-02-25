import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ScrollText,
  TrendingUp,
  MessageSquare,
  Settings2
} from 'lucide-react'
import { clsx } from 'clsx'

const TOP_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/logs', icon: ScrollText, label: 'Live Logs' },
  { to: '/positions', icon: TrendingUp, label: 'Open Positions' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' }
] as const

const BOTTOM_NAV = [{ to: '/settings', icon: Settings2, label: 'Settings' }] as const

function NavItem({
  to,
  icon: Icon,
  label
}: {
  to: string
  icon: React.ElementType
  label: string
}): React.JSX.Element {
  return (
    <NavLink
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
  )
}

export function Sidebar(): React.JSX.Element {
  return (
    <aside className="w-14 flex flex-col items-center py-3 bg-neutral-900 border-r border-neutral-800 shrink-0">
      <div className="flex flex-col gap-1">
        {TOP_NAV.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-1">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </aside>
  )
}
