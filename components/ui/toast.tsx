import { create } from 'zustand'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString()
    const newToast = { ...toast, id }
    set((state) => ({ toasts: [...state.toasts, newToast] }))

    // 自动移除
    const duration = toast.duration ?? 3000
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

// 便捷方法
export const toast = {
  success: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'success', message, duration })
  },
  error: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'error', message, duration })
  },
  warning: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'warning', message, duration })
  },
  info: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'info', message, duration })
  },
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400',
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400',
  },
  warning: {
    icon: AlertCircle,
    className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400',
  },
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed right-4 top-20 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const config = toastConfig[t.type]
        const Icon = config.icon

        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-right-2',
              'min-w-[280px] max-w-[400px]',
              config.className
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}