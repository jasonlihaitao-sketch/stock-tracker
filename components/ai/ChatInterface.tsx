'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  BarChart3,
  PieChart,
  MessageSquare,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useWatchlistStore } from '@/store/stockStore'
import type { AIResponse, StockRecommendation } from '@/lib/ai/stock-recommender'
import { generateWelcomeMessage } from '@/lib/ai/stock-recommender'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  recommendations?: StockRecommendation[]
}

interface ChatInterfaceProps {
  className?: string
}

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: '今天有什么好股票？', color: 'text-emerald-500' },
  { icon: BarChart3, text: '推荐一些突破股', color: 'text-blue-500' },
  { icon: PieChart, text: '我的自选股怎么样？', color: 'text-purple-500' },
  { icon: MessageSquare, text: '市场趋势如何？', color: 'text-orange-500' },
]

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const watchlistCodes = useWatchlistStore((state) => state.stocks)

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: generateWelcomeMessage(),
          timestamp: new Date(),
        },
      ])
    }
  }, [messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          watchlistCodes,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        const aiResponse: AIResponse = result.data
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse.message,
          timestamp: new Date(),
          recommendations: aiResponse.recommendations,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '抱歉，处理您的请求时出现了问题。请稍后再试。',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，网络连接出现问题。请检查网络后重试。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part.split('\n').map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < part.split('\n').length - 1 && <br />}
        </span>
      ))
    })
  }

  return (
    <Card className={cn('flex h-[calc(100vh-8rem)] flex-col', className)}>
      <CardHeader className="shrink-0 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-lg">AI股票助手</span>
            <p className="text-xs font-normal text-muted-foreground">
              智能选股 · 趋势分析 · 投资建议
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                )}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              <div
                className={cn(
                  'max-w-[80%] space-y-1',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {renderMessageContent(message.content)}
                </div>

                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-2 grid gap-2">
                    {message.recommendations.map((stock) => (
                      <button
                        key={stock.code}
                        className="cursor-pointer rounded-lg border bg-card p-3 text-left transition-shadow hover:shadow-md"
                        onClick={() => {
                          window.open(`/stock/${stock.code}`, '_blank')
                        }}
                        aria-label={`查看 ${stock.name} 详情`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{stock.name}</div>
                            <div className="text-xs text-muted-foreground">{stock.code}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{stock.price.toFixed(2)}</div>
                            <div
                              className={cn(
                                'text-xs',
                                stock.changePercent >= 0 ? 'text-up' : 'text-down'
                              )}
                            >
                              {stock.changePercent >= 0 ? '+' : ''}
                              {stock.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{stock.reason}</div>
                        <div className="mt-1 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-3.5 w-3.5',
                                i < stock.strength
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <span className="px-1 text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-primary"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-primary"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-primary"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span>正在分析市场数据...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 2 && !isLoading && (
          <div className="border-t bg-muted/30 px-4 py-3">
            <p className="mb-2 text-xs text-muted-foreground">试试这些问题：</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-auto px-3 py-1.5 text-xs"
                  onClick={() => handleSuggestedQuestion(item.text)}
                >
                  <item.icon className={cn('mr-1 h-3 w-3', item.color)} />
                  {item.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="shrink-0 border-t bg-background p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入您的问题，如：今天有什么好股票？"
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="shrink-0"
              aria-label="发送消息"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI助手基于技术分析提供建议，仅供参考，不构成投资建议
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
