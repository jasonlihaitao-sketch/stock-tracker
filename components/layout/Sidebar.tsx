'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Radar,
  TrendingUp,
  ClipboardList,
  PieChart,
  Bell,
  LineChart,
  ScanLine,
  Sparkles,
  Filter,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: '市场',
    items: [
      { href: '/', label: '首页', icon: Home },
      { href: '/scan', label: '市场扫描', icon: ScanLine },
      { href: '/screener', label: '股票筛选', icon: Filter },
      { href: '/sector', label: '板块雷达', icon: TrendingUp },
    ],
  },
  {
    title: '管理',
    items: [
      { href: '/position', label: '持仓监控', icon: PieChart },
      { href: '/plans', label: '操作计划', icon: ClipboardList },
      { href: '/alerts', label: '提醒中心', icon: Bell },
    ],
  },
  {
    title: '工具',
    items: [
      { href: '/ai-assistant', label: 'AI助手', icon: Sparkles },
      { href: '/strategy', label: '策略雷达', icon: Radar },
      { href: '/settings', label: '设置', icon: Settings },
    ],
  },
]

function NavItemLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon
  return (
    <Link href={item.href} className={cn('sidebar-item', isActive && 'active')}>
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-56 border-r bg-background">
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-auto py-4">
          {navGroups.map((group, index) => (
            <div key={group.title} className={cn('px-4', index > 0 && 'mt-6')}>
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </div>
              <nav className="space-y-1">
                {group.items.map((item) => (
                  <NavItemLink key={item.href} item={item} isActive={pathname === item.href} />
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* 品牌标识 */}
        <div className="border-t px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LineChart className="h-4 w-4 text-primary" />
            <span>智能交易助手 v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
