# 智能交易助手 - 产品设计规格

> 创建日期: 2026-03-13
> 版本: 1.2
> 更新: 修复类型定义和章节编号

## 一、产品概述

### 1.1 产品定位

面向中国个人投资者的智能交易助手，帮助用户：
- 制定投资策略
- 发现买入机会
- 掌握卖出时机
- 接收智能提醒
- 实现稳定盈利

### 1.2 目标用户画像

- **交易风格**: 短期波动 + 趋势跟踪
- **交易频率**: 混合模式（既有日内也有波段）
- **决策方式**: 系统自动推荐
- **风险偏好**: 稳健型（-8%~-10%止损）
- **经验水平**: 有一定经验

### 1.3 核心价值主张

**让数据流动起来，让信号自己说话**

通过自动化的策略检测和智能提醒，帮助投资者：
1. 不错过有价值的买入机会
2. 及时止损锁定收益
3. 追踪板块热点轮动
4. 科学管理仓位

### 1.4 用户故事

| 作为... | 我想要... | 以便... |
|---------|-----------|---------|
| 混合交易频率的投资者 | 同时看到日内和波段信号 | 根据我的时间安排选择交易策略 |
| 趋势跟踪者 | 自动追踪止损位 | 在保护利润的同时让盈利奔跑 |
| 板块轮动关注者 | 快速看到热门板块龙头 | 第一时间把握热点机会 |
| 稳健型投资者 | 明确的止损信号和提醒 | 控制风险，避免大幅亏损 |
| 有一定经验的投资者 | 系统推荐而非全自动化 | 结合我的判断做最终决策 |

---

## 二、设计决策

### 2.1 视觉风格

**选择: C. 极简数据风格**

- 白底配清晰卡片
- 信息一目了然
- 适合快速浏览

### 2.2 交互动效

**选择: C. 数据流动**

- 数字滚动更新
- 新数据滑入效果
- 价格闪烁高亮
- 突出信息变化

### 2.3 配色方案

**选择: A. 经典股市配色**

| 用途 | 色值 | 说明 |
|------|------|------|
| 主色 | `#0f172a` | 深蓝黑，文字和标题 |
| 涨色 | `#16a34a` | 绿色，上涨和买入信号 |
| 跌色 | `#dc2626` | 红色，下跌和卖出信号 |
| 强调 | `#3b82f6` | 蓝色，链接和交互 |
| 辅助 | `#64748b` | 灰色，次要信息 |

### 2.4 首页布局

**选择: B. 列表为主**

- 表格形式展示自选股
- 信息密度高
- 信号直接显示在行内
- 底部显示市值和盈亏统计

---

## 三、功能架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        智能交易助手                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │  首页   │ │ 板块雷达 │ │ 策略雷达 │ │ 操作计划 │ │持仓监控│ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
├─────────────────────────────────────────────────────────────┤
│                        提醒中心（全局）                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    策略引擎                           │  │
│  │  • 买入信号检测  • 卖出信号检测  • 止损追踪           │  │
│  │  • 板块扫描      • 资金流向分析                       │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    数据层                             │  │
│  │  • 新浪财经API  • 本地存储  • 状态管理               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 功能模块详解

#### 3.2.1 首页 - 智能监控中心

**布局结构:**
```
┌─────────────────────────────────────────┐
│  我的自选股                    [+添加]  │
├─────────────────────────────────────────┤
│ 名称    价格    涨跌      信号          │
│ 平安银行 10.94  +0.46%   买★★★★        │
│ 贵州茅台 1392   -0.57%   —             │
│ 比亚迪   245.8  +1.23%   卖★★★         │
├─────────────────────────────────────────┤
│ 持仓市值: 8.5万    今日盈亏: +320      │
└─────────────────────────────────────────┘
```

**数据更新动效:**
- 价格变化: 数字滚动更新 + 颜色闪烁
- 新信号: 滑入动画
- 涨跌变化: 背景色渐变

#### 3.2.2 板块雷达

**功能:**
- 热门板块排行榜（按涨幅/资金流入）
- 板块内个股联动
- 一键添加板块龙头到自选

**界面结构:**
```
┌─────────────────────────────────────────┐
│ 板块雷达                     [刷新]     │
├─────────────────────────────────────────┤
│ 热门板块                                 │
│ ┌───────────────────────────────────┐  │
│ │ 新能源汽车  +2.35%  资金流入: 12亿 │  │
│ │ 比亚迪 +1.23%  宁德时代 +0.89%    │  │
│ │ [添加龙头到自选]                   │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 半导体      +1.87%  资金流入: 8亿  │  │
│ │ ...                              │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### 3.2.3 策略雷达（信号检测）

**买入信号检测规则:**

| 信号类型 | 触发条件 | 星级 |
|----------|----------|------|
| 突破信号 | 股价突破20日高点 | ★★★ |
| 量价配合 | 放量上涨，成交量>5日均量2倍 | ★★★★ |
| 板块共振 | 个股上涨+所属板块上涨 | ★★★★★ |

**卖出信号检测规则:**

| 信号类型 | 触发条件 | 星级 |
|----------|----------|------|
| 止损触发 | 跌破买入价-8% | ★★★★★ |
| 止盈触发 | 达到目标价位 | ★★★★ |
| 趋势走弱 | 跌破5日均线 | ★★★ |

**界面结构:**
```
┌─────────────────────────────────────────┐
│ 策略雷达                                 │
├─────────────────────────────────────────┤
│ 📈 买入信号 (3)                          │
│ ┌───────────────────────────────────┐  │
│ │ 比亚迪   ★★★★  建议价: 245       │  │
│ │ 触发: 量价配合 + 板块共振         │  │
│ │ [加入计划] [查看详情]             │  │
│ └───────────────────────────────────┘  │
│                                         │
│ 📉 卖出信号 (1)                          │
│ ┌───────────────────────────────────┐  │
│ │ 平安银行 ★★★★★ 止损价: 10.08     │  │
│ │ 触发: 跌破止损线 -8%              │  │
│ │ [立即卖出] [调整止损]             │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### 3.2.4 操作计划

**功能:**
- 管理待执行操作（买入/卖出）
- 操作执行状态追踪
- 操作历史记录

**界面结构:**
```
┌─────────────────────────────────────────┐
│ 操作计划                                 │
├─────────────────────────────────────────┤
│ 待执行 (2)                               │
│ ┌───────────────────────────────────┐  │
│ │ [买入] 比亚迪  目标价: 245        │  │
│ │ 计划仓位: 20%  信号: ★★★★        │  │
│ │ [已执行] [取消] [修改]             │  │
│ └───────────────────────────────────┘  │
│                                         │
│ 已完成 (今日 3 笔)                       │
│ ┌───────────────────────────────────┐  │
│ │ [已卖出] 宁德时代  收益: +5.2%    │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### 3.2.5 持仓监控

**功能:**
- 持仓盈亏实时计算
- 止损/止盈价位追踪
- 移动止损机制

**移动止损规则:**
- 初始止损: 买入价 -8%
- 盈利后: 最高价回撤 5% 止盈
- 最大回撤保护: 不低于买入价

**界面结构:**
```
┌─────────────────────────────────────────┐
│ 持仓监控                                 │
├─────────────────────────────────────────┤
│ 总市值: 8.5万    总盈亏: +2,340 (+2.8%) │
├─────────────────────────────────────────┤
│ 比亚迪                                   │
│ 成本: 240  现价: 245.8  盈亏: +2.4%     │
│ 止损: 220.8(-8%)  移动止损: 233.5      │
│ [调整] [卖出]                           │
├─────────────────────────────────────────┤
│ 宁德时代                                 │
│ 成本: 180  现价: 194.8  盈亏: +8.2%     │
│ 止损: 165.6(-8%)  移动止损: 185.1      │
│ [调整] [卖出]                           │
└─────────────────────────────────────────┘
```

#### 3.2.6 提醒中心

**提醒类型:**
- 价格提醒: 到达目标价
- 涨跌幅提醒: 涨跌幅超过阈值
- 信号提醒: 新买入/卖出信号
- 止损提醒: 触发止损线

**界面结构:**
```
┌─────────────────────────────────────────┐
│ 提醒中心                       [设置]   │
├─────────────────────────────────────────┤
│ 🔴 触发中 (1)                            │
│ ┌───────────────────────────────────┐  │
│ │ 平安银行 触及止损线 10.08         │  │
│ │ 当前价: 10.02  亏损: -8.4%        │  │
│ │ [查看] [忽略] [调整]              │  │
│ └───────────────────────────────────┘  │
│                                         │
│ 今日提醒历史 (5)                         │
│ • 14:30 比亚迪 买入信号 ★★★★           │
│ • 11:20 宁德时代 止盈提醒               │
│ • 09:35 新能源板块涨幅超3%              │
└─────────────────────────────────────────┘
```

---

## 四、数据模型

### 4.0 模型关系说明

本系统对现有模型进行扩展，保持向后兼容：

```
Portfolio (现有) → Position (扩展)
     ↓
添加止损止盈、移动止损、最高价追踪

Alert (现有) → SmartAlert (扩展)
     ↓
新增信号类型、止损类型提醒
```

**迁移策略：**
- `Position` 继承 `Portfolio` 的所有字段，新增止损止盈相关字段
- 现有 `Portfolio` 数据在加载时自动转换，默认止损价为买入价 * 0.92（-8%）
- `SmartAlert` 使用全新类型定义，与现有 `Alert` 并存，后续逐步迁移

### 4.1 技术指标模型

```typescript
// 股票技术指标 - 用于策略引擎计算
interface StockTechnical {
  code: string

  // 价格指标
  high20d: number           // 20日最高价
  low20d: number            // 20日最低价
  ma5: number               // 5日均线
  ma10: number              // 10日均线
  ma20: number              // 20日均线

  // 成交量指标
  volume: number            // 当前成交量
  avgVolume5d: number       // 5日平均成交量
  avgVolume20d: number      // 20日平均成交量

  // 计算时间戳
  calculatedAt: string      // 计算时间
}

// 合并类型 - 策略引擎使用
interface StockWithTechnical extends Stock, StockTechnical {}
```

**数据来源：** 通过 K 线数据客户端计算（见 Section 5.5）

### 4.2 信号模型

```typescript
interface Signal {
  id: string
  stockCode: string
  stockName: string
  type: 'buy' | 'sell'
  strength: 1 | 2 | 3 | 4 | 5  // 星级
  triggerReason: string        // 触发原因
  suggestPrice?: number        // 建议价格
  stopLoss?: number           // 止损价
  takeProfit?: number         // 止盈价
  createdAt: string
  expiresAt: string           // 信号过期时间
  status: 'active' | 'expired' | 'executed'
}
```

### 4.3 操作计划模型

```typescript
interface OperationPlan {
  id: string
  signalId?: string           // 关联的信号
  stockCode: string
  stockName: string
  type: 'buy' | 'sell'
  targetPrice?: number
  quantity?: number
  positionRatio?: number      // 仓位比例
  stopLoss?: number
  takeProfit?: number
  status: 'pending' | 'executed' | 'cancelled'
  executedAt?: string
  executedPrice?: number
  note?: string
  createdAt: string
}
```

### 4.4 持仓模型扩展

```typescript
interface Position {
  id: string
  stockCode: string
  stockName: string
  buyPrice: number
  currentPrice: number
  quantity: number
  buyDate: string

  // 止损止盈
  initialStopLoss: number     // 初始止损价
  currentStopLoss: number     // 当前止损价（移动止损）
  takeProfit?: number         // 止盈价

  // 盈亏计算
  profit: number              // 盈亏金额
  profitPercent: number       // 盈亏百分比
  maxProfit: number           // 最高盈利（用于移动止损）

  // 最高价追踪
  highestPrice: number        // 持仓期间最高价
}
```

### 4.5 提醒模型

```typescript
interface SmartAlert {
  id: string
  stockCode: string
  stockName: string
  type: 'price' | 'change' | 'signal' | 'stop_loss'
  condition: {
    operator: 'above' | 'below'
    value: number
  }
  status: 'active' | 'triggered' | 'dismissed'
  triggeredAt?: string
  triggeredPrice?: number
  createdAt: string
}
```

### 4.6 板块模型

```typescript
interface Sector {
  code: string
  name: string
  changePercent: number
  capitalFlow: number         // 资金流入（亿）
  leadingStocks: {
    code: string
    name: string
    changePercent: number
  }[]
  stocks: string[]            // 板块内个股代码列表
}
```

### 4.7 自选股列表项模型

```typescript
// 首页自选股表格使用
interface WatchlistItem {
  code: string                // 纯代码（无前缀）
  fullCode: string            // 带市场前缀（sh/sz）
  name: string
  market: 'SH' | 'SZ'

  // 行情数据
  price: number
  change: number
  changePercent: number

  // 信号（可选）
  signal?: {
    type: 'buy' | 'sell'
    strength: 1 | 2 | 3 | 4 | 5
    triggerReason: string
  }

  // 持仓标记
  isHeld: boolean             // 是否持有

  // 时间戳
  updatedAt: string
}
```

---

## 五、策略引擎

### 5.1 买入信号检测逻辑

```typescript
function detectBuySignals(stock: StockWithTechnical, sector?: Sector): Signal[] {
  const signals: Signal[] = []

  // 1. 突破信号
  if (stock.price > stock.high20d) {
    signals.push({
      type: 'buy',
      strength: 3,
      triggerReason: '突破20日高点'
    })
  }

  // 2. 量价配合
  if (stock.changePercent > 0 && stock.volume > stock.avgVolume5d * 2) {
    signals.push({
      type: 'buy',
      strength: 4,
      triggerReason: '量价配合'
    })
  }

  // 3. 板块共振
  if (stock.changePercent > 0 && sector && sector.changePercent > 1) {
    signals.push({
      type: 'buy',
      strength: 5,
      triggerReason: '板块共振',
      // 合并其他条件时升级星级
    })
  }

  return mergeSignals(signals)
}
```

### 5.2 卖出信号检测逻辑

```typescript
function detectSellSignals(position: Position, stock: StockWithTechnical): Signal[] {
  const signals: Signal[] = []

  // 1. 止损触发（最高优先级）
  if (stock.price <= position.currentStopLoss) {
    return [{
      type: 'sell',
      strength: 5,
      triggerReason: `触发止损线 ${position.currentStopLoss}`,
      stopLoss: position.currentStopLoss
    }]
  }

  // 2. 止盈触发
  if (position.takeProfit && stock.price >= position.takeProfit) {
    signals.push({
      type: 'sell',
      strength: 4,
      triggerReason: `达到止盈目标 ${position.takeProfit}`
    })
  }

  // 3. 趋势走弱
  if (stock.price < stock.ma5) {
    signals.push({
      type: 'sell',
      strength: 3,
      triggerReason: '跌破5日均线'
    })
  }

  return signals
}
```

### 5.3 移动止损更新逻辑

```typescript
function updateTrailingStop(position: Position, currentPrice: number): number {
  // 更新最高价
  const newHighest = Math.max(position.highestPrice, currentPrice)

  // 移动止损 = 最高价 * (1 - 0.05) = 回撤5%
  let newStopLoss = newHighest * 0.95

  // 确保不低于初始止损
  newStopLoss = Math.max(newStopLoss, position.initialStopLoss)

  // 确保不低于买入价（保护本金）
  newStopLoss = Math.max(newStopLoss, position.buyPrice)

  return newStopLoss
}
```

### 5.4 信号合并逻辑

```typescript
function mergeSignals(signals: Signal[]): Signal[] {
  if (signals.length === 0) return []
  if (signals.length === 1) return signals

  // 同类型信号合并规则
  // 1. 取最高星级
  // 2. 合并触发原因
  // 3. 多信号叠加时，星级+1（最高5星）

  const buySignals = signals.filter(s => s.type === 'buy')
  const sellSignals = signals.filter(s => s.type === 'sell')

  const result: Signal[] = []

  if (buySignals.length > 1) {
    // 多个买入信号合并
    const maxStrength = Math.min(5, Math.max(...buySignals.map(s => s.strength)) + 1)
    const reasons = [...new Set(buySignals.map(s => s.triggerReason))].join(' + ')

    result.push({
      ...buySignals[0],
      strength: maxStrength as 1|2|3|4|5,
      triggerReason: reasons
    })
  } else if (buySignals.length === 1) {
    result.push(buySignals[0])
  }

  if (sellSignals.length > 1) {
    // 多个卖出信号合并
    const maxStrength = Math.min(5, Math.max(...sellSignals.map(s => s.strength)) + 1)
    const reasons = [...new Set(sellSignals.map(s => s.triggerReason))].join(' + ')

    result.push({
      ...sellSignals[0],
      strength: maxStrength as 1|2|3|4|5,
      triggerReason: reasons
    })
  } else if (sellSignals.length === 1) {
    result.push(sellSignals[0])
  }

  return result
}
```

**信号合并示例：**
- 量价配合（4星）+ 板块共振（5星）= 量价配合 + 板块共振（5星）
- 突破信号（3星）+ 量价配合（4星）= 突破信号 + 量价配合（5星）

### 5.5 技术指标计算

**数据来源映射：**

| 数据项 | 来源 | 计算方式 |
|--------|------|----------|
| 实时价格 | 新浪财经 API | 直接获取 |
| K线数据 | 新浪财经 API | 获取20日K线 |
| 20日最高/最低 | K线数据 | 客户端计算 |
| 5日/10日/20日均线 | K线数据 | 客户端计算 |
| 5日均量 | K线数据 | 客户端计算 |
| 板块数据 | 东方财富 API | 板块涨跌幅、资金流向 |
| 板块成分股 | 东方财富 API | 板块内个股列表 |

**计算实现：**

```typescript
async function calculateTechnicalIndicators(code: string): Promise<StockTechnical> {
  // 获取20日K线数据
  const klines = await fetchKlineData(code, 20)

  const closes = klines.map(k => k.close)
  const volumes = klines.map(k => k.volume)

  return {
    code,
    high20d: Math.max(...klines.map(k => k.high)),
    low20d: Math.min(...klines.map(k => k.low)),
    ma5: calculateMA(closes, 5),
    ma10: calculateMA(closes, 10),
    ma20: calculateMA(closes, 20),
    volume: volumes[volumes.length - 1],
    avgVolume5d: calculateMA(volumes, 5),
    avgVolume20d: calculateMA(volumes, 20),
    calculatedAt: new Date().toISOString()
  }
}

function calculateMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1]
  const slice = data.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}
```

---

## 六、UI组件设计

### 6.1 设计系统

**间距规范:**
- 基础单位: 4px
- 卡片内边距: 16px
- 卡片间距: 12px
- 区块间距: 24px

**圆角规范:**
- 小组件: 6px
- 卡片: 8px
- 大区块: 12px

**阴影规范:**
- 卡片: `0 1px 3px rgba(0,0,0,0.1)`
- 悬停: `0 4px 12px rgba(0,0,0,0.15)`

### 6.2 核心组件

**SignalBadge - 信号徽章**
```tsx
interface SignalBadgeProps {
  type: 'buy' | 'sell'
  strength: 1 | 2 | 3 | 4 | 5
}
// 显示: 买★★★★ 或 卖★★★
```

**PriceDisplay - 价格显示（带动画）**
```tsx
interface PriceDisplayProps {
  value: number
  previousValue?: number
  showChange?: boolean
}
// 数字滚动动画 + 颜色闪烁
```

**StockTable - 股票表格**
```tsx
interface StockTableProps {
  stocks: WatchlistItem[]
  showSignal?: boolean
  onRowClick?: (stock: WatchlistItem) => void
}
```

**SectorCard - 板块卡片**
```tsx
interface SectorCardProps {
  sector: Sector
  onAddLeadingStocks?: (stocks: string[]) => void
}
```

---

## 七、数据流设计

### 7.1 实时数据更新流程

```
用户打开页面
    ↓
SWR 初始化数据获取
    ↓
设置 3 秒轮询间隔
    ↓
每次更新:
  1. 获取最新价格
  2. 检测信号变化
  3. 更新持仓盈亏
  4. 检查提醒触发
    ↓
状态更新 → UI 动画渲染
```

### 7.2 状态管理结构

```typescript
// store/signalStore.ts
interface SignalState {
  buySignals: Signal[]
  sellSignals: Signal[]
  addSignal: (signal: Signal) => void
  removeSignal: (id: string) => void
  updateSignals: (stocks: Stock[]) => void
}

// store/positionStore.ts
interface PositionState {
  positions: Position[]
  updatePosition: (code: string, price: number) => void
  calculateTotalProfit: () => { amount: number, percent: number }
}

// store/alertStore.ts
interface AlertState {
  alerts: SmartAlert[]
  triggeredAlerts: SmartAlert[]
  checkAlerts: (stocks: Stock[]) => void
}
```

---

## 八、开发计划

### Phase 1: 核心功能重构（1周）

1. 扩展数据模型（Position、Signal、Alert）
2. 实现策略引擎基础框架
3. 重构首页为列表布局
4. 实现数据流动动效

### Phase 2: 信号系统（1周）

1. 实现买入信号检测
2. 实现卖出信号检测
3. 策略雷达页面开发
4. 操作计划功能

### Phase 3: 板块与持仓（1周）

1. 板块雷达功能
2. 持仓监控功能
3. 移动止损实现
4. 盈亏计算优化

### Phase 4: 提醒系统（3天）

1. 提醒中心页面
2. 提醒触发逻辑
3. 浏览器通知集成

### Phase 5: 优化与测试（3天）

1. 性能优化
2. 边界情况处理
3. 端到端测试
4. 用户体验优化

---

## 九、验收标准

### 功能验收

- [ ] 自选股列表正确显示，信号星级准确
- [ ] 买入信号检测准确率 > 85%
- [ ] 卖出信号检测准确率 > 90%
- [ ] 移动止损正确计算和更新
- [ ] 提醒准时触发，无漏报误报
- [ ] 板块数据准确，龙头识别正确
- [ ] 操作计划状态流转正确

### 性能验收

- [ ] 首页加载时间 < 2秒
- [ ] 数据更新响应时间 < 500ms
- [ ] 动画流畅，无卡顿（60fps）
- [ ] 内存占用 < 100MB

### 用户体验验收

- [ ] 所有价格变化有动效反馈
- [ ] 信号变化有视觉提示
- [ ] 操作响应即时，无等待感
- [ ] 移动端适配良好

---

## 十、边界情况与错误处理

### 10.1 API 异常处理

| 场景 | 处理方式 |
|------|----------|
| API 请求超时 | 显示上次缓存数据 + "数据延迟"提示，3秒后自动重试 |
| API 返回错误 | 显示错误提示，保留旧数据，下一次轮询时重试 |
| 数据格式异常 | 记录日志，忽略本次更新，不崩溃 |
| 网络断开 | 显示"网络已断开"，每5秒尝试重连 |

### 10.2 非交易时段处理

```typescript
function isMarketOpen(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const day = now.getDay()

  // 周末
  if (day === 0 || day === 6) return false

  // 交易时间: 9:30-11:30, 13:00-15:00
  const isMorning = hour === 9 && minute >= 30 || hour === 10 || hour === 11 && minute < 30
  const isAfternoon = hour === 13 || hour === 14 || hour === 15 && minute === 0

  return isMorning || isAfternoon
}

// 非交易时段行为
if (!isMarketOpen()) {
  // 1. 停止轮询
  // 2. 显示"市场已闭市"状态
  // 3. 显示最后交易时间
  // 4. 保留信号但不更新
}
```

### 10.3 特殊股票处理

| 类型 | 处理方式 |
|------|----------|
| 停牌股票 | 标记"停牌"，停止更新，保留最后数据 |
| ST股票 | 显示"ST"标识，风险警示 |
| 新股上市 | 等待上市后开始追踪 |
| 退市股票 | 从自选股移除，保留历史记录 |

### 10.4 信号过期处理

```typescript
// 信号默认有效期
const SIGNAL_EXPIRY_HOURS = {
  buy: 24,    // 买入信号24小时后过期
  sell: 4     // 卖出信号4小时后过期（更紧急）
}

function checkSignalExpiry(signal: Signal): boolean {
  const expiresAt = new Date(signal.expiresAt)
  return new Date() > expiresAt
}

// 过期信号处理
// 1. 自动标记为 expired
// 2. 从活跃列表移除
// 3. 存入历史记录
// 4. 不再触发提醒
```

### 10.5 浏览器通知权限

```typescript
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('浏览器不支持通知')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// 权限被拒绝时的处理
// 1. 显示提示："请在浏览器设置中允许通知"
// 2. 仅使用页面内提醒
// 3. 不阻止核心功能使用
```

### 10.6 数据缓存策略

**缓存 vs 轮询协调：**

| 数据类型 | 缓存时间 | 轮询间隔 | 说明 |
|----------|----------|----------|------|
| 实时行情 | 不缓存 | 3秒 | 每次请求最新数据 |
| K线数据 | 1小时 | - | 每日更新一次即可 |
| 板块数据 | 5分钟 | - | 交易日频繁更新 |
| 基本面数据 | 1天 | - | 较少变化 |

**SWR 配置：**

```typescript
// 实时行情 - 不缓存，强制刷新
useSWR('/api/stocks/realtime', fetcher, {
  refreshInterval: 3000,
  revalidateOnFocus: true,
  dedupingInterval: 0  // 不去重，每次都请求
})

// K线数据 - 长缓存
useSWR('/api/stocks/kline', fetcher, {
  refreshInterval: 3600000,  // 1小时
  dedupingInterval: 3600000
})
```

---

## 十一、验收标准详细定义

### 11.1 信号准确率定义

**买入信号准确率：**
- 定义：买入信号发出后，5个交易日内股价上涨 ≥ 3% 的比例
- 目标：> 85%
- 统计方式：统计过去30天的所有买入信号

**卖出信号准确率：**
- 定义：卖出信号发出后，5个交易日内股价下跌 ≥ 2% 或成功避开更大跌幅的比例
- 目标：> 90%
- 统计方式：统计过去30天的所有卖出信号

**止损信号准确率：**
- 定义：触发止损后，股价继续下跌的比例
- 目标：> 95%
- 统计方式：统计所有触发止损的案例

### 11.2 功能验收清单

| 功能点 | 验收标准 | 测试方法 |
|--------|----------|----------|
| 自选股列表 | 显示完整，信号准确 | 手动添加10只股票验证 |
| 买入信号 | 检测准确，星级正确 | 模拟历史数据回测 |
| 卖出信号 | 止损及时，不漏报 | 模拟跌破止损价测试 |
| 移动止损 | 正确上移，不回落 | 模拟股价上涨场景 |
| 提醒触发 | 准时触发，无遗漏 | 设置提醒等待触发 |
| 板块数据 | 数据准确，龙头正确 | 对比东方财富数据 |
| 操作计划 | 状态流转正确 | 完整执行流程测试 |

### 11.3 性能验收

| 指标 | 目标 | 测试方法 |
|------|------|----------|
| 首页加载 | < 2秒 | Chrome DevTools |
| 数据更新响应 | < 500ms | 网络面板 |
| 动画帧率 | 60fps | Performance 面板 |
| 内存占用 | < 100MB | Memory 面板 |
| CPU 占用 | < 5%（空闲时） | Task Manager |