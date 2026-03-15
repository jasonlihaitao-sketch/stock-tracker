import { LineChart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t py-4 bg-muted/30">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          <span>StockTracker</span>
        </div>
        <div className="flex items-center gap-4">
          <span>数据来源：新浪财经</span>
          <span>仅供学习参考，不构成投资建议</span>
        </div>
      </div>
    </footer>
  )
}