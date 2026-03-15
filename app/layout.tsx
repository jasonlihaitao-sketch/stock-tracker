import type { Metadata } from 'next'
import { Fira_Sans, Fira_Code } from 'next/font/google'
import './globals.css'
import { GlobalProviders } from '@/components/GlobalProviders'
import { AppLayout } from '@/components/layout/AppLayout'

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: '智能交易助手 - 股票跟踪',
  description: '个人股票跟踪工具，支持自选股监控、持仓管理、价格预警、市场扫描',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('stock-tracker-theme');
                  var theme = 'system';
                  if (stored) {
                    try {
                      var parsed = JSON.parse(stored);
                      theme = parsed.state?.theme || 'system';
                    } catch(e) {}
                  }
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  if (resolved === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${firaSans.variable} ${firaCode.variable} font-sans`}>
        <GlobalProviders>
          <AppLayout>{children}</AppLayout>
        </GlobalProviders>
      </body>
    </html>
  )
}