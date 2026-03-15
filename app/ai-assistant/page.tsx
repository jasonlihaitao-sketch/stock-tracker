import { MessageSquare, Radar, Star, TrendingUp } from 'lucide-react'
import { ChatInterface } from '@/components/ai/ChatInterface'
import { Card, CardContent } from '@/components/ui/card'

const capabilities = [
  {
    icon: TrendingUp,
    title: '机会推荐',
    description: '结合扫描结果和行情数据，输出今日更值得关注的标的。',
  },
  {
    icon: Radar,
    title: '趋势解读',
    description: '回答市场强弱、自选股表现和热点方向等问题。',
  },
  {
    icon: Star,
    title: '重点提示',
    description: '优先展示突破、放量、共振等更强的技术信号。',
  },
  {
    icon: MessageSquare,
    title: '对话式使用',
    description: '支持自然语言提问，不需要记固定命令。',
  },
]

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="page-title">AI 助手</h1>
        <p className="page-description">
          用对话方式快速查看市场机会、自选股表现和当下的技术面信号。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title}>
              <CardContent className="flex gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ChatInterface />
    </div>
  )
}
