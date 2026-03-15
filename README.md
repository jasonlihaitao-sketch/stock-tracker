# 股票跟踪网站

面向中国市场的个人投资者，提供自选股监控、实时行情、价格预警、持仓管理等功能。

## 功能特性

- **自选股管理** - 添加、分组管理自选股票，实时查看行情
- **实时行情** - 股票价格、涨跌幅、成交量等实时数据展示
- **K线图表** - 日K、周K、月K及分时图表展示
- **智能选股** - 多策略筛选符合条件的股票
- **板块分析** - 行业板块热度、涨跌排行
- **价格预警** - 设置价格提醒，及时获取通知
- **持仓管理** - 记录买入卖出，计算盈亏
- **技术指标** - MA、MACD、KDJ、RSI 等常用指标
- **AI 助手** - 智能股票诊断与建议

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 14.x (App Router) |
| 语言 | TypeScript | 5.x |
| 样式 | TailwindCSS | 3.x |
| UI组件 | shadcn/ui | latest |
| 图表 | ECharts | 5.x |
| 状态管理 | Zustand | 4.x |
| 数据获取 | SWR | 2.x |
| 包管理器 | pnpm | 8.x |

## 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- pnpm 8.x

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 项目结构

```
stock-tracker/
├── app/                 # Next.js App Router 页面
│   ├── api/             # API Routes
│   ├── stock/[code]/    # 股票详情页
│   ├── portfolio/       # 持仓管理
│   ├── alerts/          # 预警管理
│   └── screener/        # 智能选股
├── components/          # React 组件
│   ├── ui/              # shadcn/ui 基础组件
│   ├── layout/          # 布局组件
│   ├── stock/           # 股票相关组件
│   ├── portfolio/       # 持仓相关组件
│   └── alert/           # 预警相关组件
├── hooks/               # 自定义 Hooks
├── lib/                 # 工具库
│   ├── api/             # API 客户端
│   ├── scanner/         # 选股策略
│   ├── technical/       # 技术指标计算
│   └── utils/           # 工具函数
├── store/               # Zustand 状态管理
├── types/               # TypeScript 类型定义
└── public/              # 静态资源
```

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 运行 ESLint 检查
pnpm lint:fix     # 自动修复 ESLint 问题
pnpm format       # 格式化代码
pnpm type-check   # TypeScript 类型检查
```

## 数据源

开发阶段使用以下免费 API：

- **新浪财经** - 实时行情数据
- **东方财富** - 财务数据

> 注意：数据请求通过 Next.js API Routes 代理，避免跨域问题。

## 数据存储

MVP 阶段使用浏览器本地存储：

- **localStorage** - 用户设置、预警配置
- **IndexedDB** - 自选股列表、持仓记录

## 开发计划

- [ ] 用户系统与云端同步
- [ ] 更多技术指标
- [ ] 回测功能
- [ ] 移动端 App

## License

MIT