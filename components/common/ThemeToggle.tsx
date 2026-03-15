'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
]

interface ThemeToggleProps {
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ThemeToggle({
  className,
  variant = 'ghost',
  size = 'icon',
}: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore()

  const currentOption = themeOptions.find((opt) => opt.value === theme)
  const Icon = currentOption?.icon || Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            'relative h-9 w-9 rounded-full',
            className
          )}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {themeOptions.map((option) => {
          const OptionIcon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                theme === option.value && 'bg-accent'
              )}
            >
              <OptionIcon className="h-4 w-4" />
              <span>{option.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ThemeToggleSimple({
  className,
  variant = 'ghost',
  size = 'icon',
}: ThemeToggleProps) {
  const { toggleTheme, resolvedTheme } = useThemeStore()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'relative h-9 w-9 rounded-full',
        className
      )}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">
        切换到{resolvedTheme === 'dark' ? '浅色' : '深色'}模式
      </span>
    </Button>
  )
}
