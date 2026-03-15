# 功能补全实施路线图

> 创建日期: 2026-03-14
> 版本: 1.0

## 一、文档索引

本文档汇总了股票跟踪网站缺失功能的技术实施方案，指导后续开发工作。

| 文档 | 路径 | 功能范围 |
|------|------|----------|
| 预警系统实施方案 | `docs/specs/alert-system-implementation.md` | AlertForm、预警监控、浏览器通知、API |
| 数据持久化增强方案 | `docs/specs/data-persistence-enhancement.md` | 数据导出/导入、版本迁移 |
| 持仓管理增强方案 | `docs/specs/position-management-enhancement.md` | 交易记录、分批建仓、持仓历史 |

---

## 二、功能优先级总览

```
┌─────────────────────────────────────────────────────────────┐
│                        优先级矩阵                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  P0 (必须)          P1 (重要)          P2 (增强)           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ AlertForm   │    │ 浏览器通知  │    │ 数据导出    │     │
│  │ 预警规则管理│    │ /api/alerts │    │ 数据导入    │     │
│  │ 预警触发监控│    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  P3 (优化)                                                  │
│  ┌─────────────┐                                           │
│  │ 交易记录    │                                           │
│  │ 分批建仓    │                                           │
│  │ 持仓历史    │                                           │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、实施阶段规划

### Phase 1: 预警核心功能（预计 3 天）

**目标：** 完成预警规则创建和触发监控

| 任务 | 预估时间 | 产出物 |
|------|----------|--------|
| AlertForm 组件 | 0.5天 | `components/alert/AlertForm.tsx` |
| AlertRuleList 组件 | 0.5天 | `components/alert/AlertRuleList.tsx` |
| 预警监控服务 | 1天 | `lib/alert/monitor.ts` |
| 提醒中心集成 | 0.5天 | 更新 `app/alerts/page.tsx` |
| 股票详情页集成 | 0.5天 | 更新 `app/stock/[code]/page.tsx` |

**验收标准：**
- [ ] 可以创建价格/涨跌幅预警
- [ ] 预警条件满足时自动触发
- [ ] 提醒中心显示触发状态

---

### Phase 2: 预警完善（预计 1 天）

**目标：** 完成浏览器通知和 API 端点

| 任务 | 预估时间 | 产出物 |
|------|----------|--------|
| 浏览器通知服务 | 0.5天 | `lib/alert/notification.ts` |
| /api/alerts CRUD | 0.5天 | `app/api/alerts/route.ts` |

**验收标准：**
- [ ] 预警触发时发送浏览器通知
- [ ] API 端点支持 CRUD 操作

---

### Phase 3: 数据管理（预计 2 天）

**目标：** 完成数据导出/导入功能

| 任务 | 预估时间 | 产出物 |
|------|----------|--------|
| 导出服务 | 0.5天 | `lib/data/export.ts` |
| 导入服务 | 1天 | `lib/data/import.ts` |
| 设置页面 | 0.5天 | `app/settings/page.tsx` |

**验收标准：**
- [ ] 可导出所有用户数据为 JSON
- [ ] 可从 JSON 文件恢复数据
- [ ] 支持合并/替换模式导入

---

### Phase 4: 持仓增强（预计 3 天）

**目标：** 完成交易记录和分批建仓

| 任务 | 预估时间 | 产出物 |
|------|----------|--------|
| 交易记录类型和 Store | 0.5天 | `types/transaction.ts`, `store/transactionStore.ts` |
| 分批建仓逻辑 | 0.5天 | 更新 `store/positionStore.ts` |
| TransactionHistory 组件 | 1天 | `components/position/TransactionHistory.tsx` |
| TransactionForm 组件 | 0.5天 | `components/position/TransactionForm.tsx` |
| 持仓历史组件 | 0.5天 | `components/position/PositionHistoryList.tsx` |

**验收标准：**
- [ ] 记录每笔买入/卖出交易
- [ ] 分批买入自动计算平均成本
- [ ] 查看已清仓股票历史

---

## 四、技术架构更新

### 4.1 新增文件结构

```
stock-tracker/
├── app/
│   ├── api/
│   │   └── alerts/                 # 新增
│   │       ├── route.ts            # GET, POST
│   │       └── [id]/
│   │           ├── route.ts        # GET, PUT, DELETE
│   │           └── toggle/route.ts # PATCH
│   └── settings/
│       └── page.tsx                # 新增
├── components/
│   ├── alert/
│   │   ├── AlertForm.tsx           # 新增
│   │   ├── AlertRuleList.tsx       # 新增
│   │   └── AlertTriggerIndicator.tsx # 新增
│   ├── position/
│   │   ├── TransactionHistory.tsx  # 新增
│   │   ├── TransactionForm.tsx     # 新增
│   │   └── PositionHistoryList.tsx # 新增
│   └── settings/
│       ├── ExportButton.tsx        # 新增
│       └── ImportButton.tsx        # 新增
├── lib/
│   ├── alert/
│   │   ├── monitor.ts              # 新增
│   │   └── notification.ts         # 新增
│   ├── data/
│   │   ├── export.ts               # 新增
│   │   ├── import.ts               # 新增
│   │   └── migration.ts            # 新增
│   └── position/
│       └── calculator.ts           # 新增
├── store/
│   └── transactionStore.ts         # 新增
└── types/
    ├── transaction.ts              # 新增
    └── export.ts                   # 新增
```

### 4.2 依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│                         UI 层                                │
├─────────────────────────────────────────────────────────────┤
│  AlertForm    AlertRuleList    TransactionForm    ...       │
│       │            │                  │                      │
│       └────────────┴──────────────────┘                      │
│                    │                                         │
├────────────────────┼────────────────────────────────────────┤
│                   Store 层                                   │
├────────────────────┼────────────────────────────────────────┤
│  alertStore ◄─────┼─────► transactionStore                  │
│       │            │                  │                      │
│       └────────────┴──────────────────┘                      │
│                    │                                         │
├────────────────────┼────────────────────────────────────────┤
│                   服务层                                     │
├────────────────────┼────────────────────────────────────────┤
│  monitor.ts   notification.ts   calculator.ts               │
│                    │                                         │
├────────────────────┼────────────────────────────────────────┤
│                   数据层                                     │
├────────────────────┼────────────────────────────────────────┤
│  API Routes ◄─────┼─────► localStorage (Zustand persist)    │
└────────────────────┴────────────────────────────────────────┘
```

---

## 五、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 预警监控影响页面性能 | 中 | 中 | 仅交易时段启动，控制轮询频率 |
| 浏览器通知权限被拒绝 | 高 | 低 | 提供页面内提醒作为降级 |
| 数据导入格式错误 | 中 | 中 | 严格验证，提供详细错误信息 |
| 分批建仓计算误差 | 低 | 高 | 单元测试覆盖各种场景 |

---

## 六、下一步行动

### 立即可开始

1. **AlertForm 组件** - 预警规则创建入口，是预警功能的基础
2. **预警监控服务** - 核心逻辑，实现价格监控

### 建议顺序

```
Phase 1 (预警核心) → Phase 2 (预警完善) → Phase 3 (数据管理) → Phase 4 (持仓增强)
```

### 并行开发可能

- Phase 1 和 Phase 3 可以并行开发（无依赖）
- Phase 2 依赖 Phase 1
- Phase 4 相对独立，可与 Phase 2/3 并行

---

## 七、联系方式

如有问题或需要进一步讨论，请参考各详细设计文档或联系项目负责人。