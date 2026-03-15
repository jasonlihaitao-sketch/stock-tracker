'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LineChart,
  Search,
  Settings,
  Menu,
  X,
  Home,
  Radar,
  TrendingUp,
  ClipboardList,
  PieChart,
  Bell,
  ScanLine,
  Sparkles,
  Filter,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { StockSearch } from '@/components/stock'
import { useWatchlistStore } from '@/store/stockStore'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

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

function Header({
  onMenuToggle,
  isMobileMenuOpen,
}: {
  onMenuToggle: () => void
  isMobileMenuOpen: boolean
}) {
  const { addStock } = useWatchlistStore()

  const handleAddStock = (stock: { code: string }) => {
    const pureCode = stock.code.replace(/^(sh|sz)/i, '')
    const market = stock.code.toLowerCase().startsWith('sh') ? 'sh' : 'sz'
    addStock(`${market}${pureCode}`)
  }

  return (
    <header className="sticky top-0 z-50 h-14 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Logo 区域 */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/" className="group flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5 transition-colors group-hover:bg-primary/20">
              <LineChart className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden text-lg font-bold sm:block">智能交易助手</span>
          </Link>
        </div>

        {/* 搜索框 */}
        <div className="mx-4 hidden max-w-md flex-1 md:block">
          <StockSearch
            placeholder="搜索股票代码或名称..."
            onSelect={handleAddStock}
            className="w-full"
          />
        </div>

        {/* 工具栏 */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/settings">
            <Button variant="ghost" size="icon" title="设置" className="hidden sm:flex">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      {/* 移动端侧边栏遮罩 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-56 border-r bg-background transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <ScrollArea className="flex-1 py-4">
            {navGroups.map((group, index) => (
              <div key={group.title} className={cn('px-3', index > 0 && 'mt-6')}>
                <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </div>
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn('sidebar-item', isActive && 'active')}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ))}
          </ScrollArea>

          {/* 品牌标识 */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LineChart className="h-4 w-4 text-primary" />
              <span>智能交易助手 v1.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="min-h-[calc(100vh-3.5rem)] lg:ml-56">
        <div className="mx-auto max-w-7xl animate-fade-in p-4 lg:p-6">{children}</div>
      </main>
    </div>
  )
}
