import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-xl text-muted-foreground mb-4">页面未找到</h2>
          <p className="text-muted-foreground mb-6">
            您访问的页面不存在或已被移除
          </p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}