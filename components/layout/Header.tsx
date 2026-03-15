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
  Menu,
  X,
  LineChart,
  ScanLine,
  Sparkles,
  Filter,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/ThemeToggle'

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/strategy', label: '策略雷达', icon: Radar },
  { href: '/scan', label: '市场扫描', icon: ScanLine },
  { href: '/screener', label: '股票筛选', icon: Filter },
  { href: '/sector', label: '板块雷达', icon: TrendingUp },
  { href: '/plans', label: '操作计划', icon: ClipboardList },
  { href: '/position', label: '持仓监控', icon: PieChart },
  { href: '/ai-assistant', label: 'AI助手', icon: Sparkles },
  { href: '/alerts', label: '提醒中心', icon: Bell },
  { href: '/settings', label: '设置', icon: Settings },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <LineChart className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">智能交易助手</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 items-center space-x-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('gap-2', isActive && 'bg-muted')}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="border-t bg-background md:hidden">
          <div className="container space-y-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start gap-2', isActive && 'bg-muted')}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
