# AI Stock Selection Assistant Design Spec

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Build an AI-powered stock selection assistant integrated into the homepage as a collapsible panel, supporting stock selection, analysis, and learning questions via Alibaba Bailian API.

**Architecture:** SQLite database for all persistent data with encrypted API key storage. Next.js API routes proxy AI requests to Alibaba Bailian (OpenAI SDK compatible). React components for collapsible chat panel with quick action buttons.

**Tech Stack:** Next.js 14, TypeScript, SQLite (better-sqlite3), Zustand, ECharts, Alibaba Bailian API, AES-256-GCM encryption

---

## Database Design

### Database Initialization

**File Location:** `data/stock-tracker.db`

```typescript
// lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'stock-tracker.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

// Initialize schema on startup
db.exec(`
  CREATE TABLE IF NOT EXISTS user_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT,
    group_name TEXT DEFAULT '默认',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sort_order INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_watchlist_group ON watchlist(group_name);
  CREATE INDEX IF NOT EXISTS idx_watchlist_code ON watchlist(code);

  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_code TEXT NOT NULL,
    stock_name TEXT,
    quantity INTEGER NOT NULL,
    buy_price REAL NOT NULL,
    buy_date DATE NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_positions_code ON positions(stock_code);

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_code TEXT NOT NULL,
    stock_name TEXT,
    type TEXT NOT NULL CHECK(type IN ('price_up', 'price_down', 'change_up', 'change_down')),
    target_value REAL NOT NULL,
    enabled INTEGER DEFAULT 1,
    triggered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_alerts_code ON alerts(stock_code);
  CREATE INDEX IF NOT EXISTS idx_alerts_enabled ON alerts(enabled);

  CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('selection', 'analysis', 'learning', 'general')),
    related_stocks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_conversations_created ON ai_conversations(created_at DESC);

  CREATE TABLE IF NOT EXISTS operation_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_code TEXT NOT NULL,
    stock_name TEXT,
    plan_type TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'executed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    executed_at DATETIME
  );
  CREATE INDEX IF NOT EXISTS idx_plans_status ON operation_plans(status);
`);
```

### Tables

#### 1. user_config
Stores user configuration including encrypted API key.

```sql
CREATE TABLE user_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- `ai_api_key`: Encrypted API key (AES-256-GCM)
- `ai_model`: Model identifier (default: qwen-plus)
- `ai_base_url`: API base URL (default: https://dashscope.aliyuncs.com/compatible-mode/v1)

#### 2. watchlist
Migrated from localStorage watchlist store.

```sql
CREATE TABLE watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  group_name TEXT DEFAULT '默认',
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_watchlist_group ON watchlist(group_name);
CREATE INDEX idx_watchlist_code ON watchlist(code);
```

#### 3. positions
Migrated from localStorage position store.

```sql
CREATE TABLE positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  quantity INTEGER NOT NULL,
  buy_price REAL NOT NULL,
  buy_date DATE NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_positions_code ON positions(stock_code);
```

#### 4. alerts
Migrated from localStorage alert store.

```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  type TEXT NOT NULL CHECK(type IN ('price_up', 'price_down', 'change_up', 'change_down')),
  target_value REAL NOT NULL,
  enabled INTEGER DEFAULT 1,
  triggered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_code ON alerts(stock_code);
CREATE INDEX idx_alerts_enabled ON alerts(enabled);
```

#### 5. ai_conversations
Stores conversation history with AI assistant.

```sql
CREATE TABLE ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  question_type TEXT CHECK(question_type IN ('selection', 'analysis', 'learning', 'general')),
  related_stocks TEXT, -- JSON array of stock codes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_created ON ai_conversations(created_at DESC);
```

Retention: Keep last 50 conversations, auto-delete older ones.

### Retention Implementation

```typescript
// lib/db.ts - After inserting a new conversation

function enforceConversationRetention() {
  const COUNT_QUERY = 'SELECT COUNT(*) as count FROM ai_conversations';
  const DELETE_QUERY = `
    DELETE FROM ai_conversations
    WHERE id NOT IN (
      SELECT id FROM ai_conversations
      ORDER BY created_at DESC
      LIMIT 50
    )
  `;

  const { count } = db.prepare(COUNT_QUERY).get() as { count: number };
  if (count > 50) {
    db.prepare(DELETE_QUERY).run();
  }
}

// Called after each message insertion
export function insertConversation(message: Message) {
  db.prepare(`
    INSERT INTO ai_conversations (role, content, question_type, related_stocks, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(message.role, message.content, message.questionType || null, JSON.stringify(message.relatedStocks || []), new Date().toISOString());

  enforceConversationRetention();
}
```

#### 6. operation_plans
Stores AI-generated operation plans.

```sql
CREATE TABLE operation_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  plan_type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'executed', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  executed_at DATETIME
);

CREATE INDEX idx_plans_status ON operation_plans(status);
```

---

## Type Definitions

### Core Types

```typescript
// types/ai.ts

interface ScanResult {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  signal: string;
}

interface SuggestedAction {
  type: 'add_watchlist' | 'create_alert' | 'view_detail' | 'add_position';
  label: string;
  stockCode: string;
  data?: Record<string, unknown>;
}

### Suggested Action Generation

Suggested actions are generated by post-processing AI responses to extract actionable recommendations:

```typescript
// lib/ai/suggestions.ts

function extractSuggestedActions(aiResponse: string, mentionedStocks: string[]): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  for (const stockCode of mentionedStocks) {
    // Add to watchlist suggestion (if not already in watchlist)
    actions.push({
      type: 'add_watchlist',
      label: '添加到自选',
      stockCode,
    });

    // Check for price-related recommendations in response
    if (aiResponse.includes('买入') || aiResponse.includes('建仓')) {
      actions.push({
        type: 'add_position',
        label: '记录持仓',
        stockCode,
      });
    }

    // Check for alert-worthy mentions
    if (aiResponse.includes('突破') || aiResponse.includes('支撑') || aiResponse.includes('压力')) {
      actions.push({
        type: 'create_alert',
        label: '设置预警',
        stockCode,
      });
    }
  }

  return actions;
}
```

The AI system prompt also instructs the model to mention stock codes clearly for parsing:

```
When recommending stocks, always mention the stock code in parentheses after the name.
Example: "平安银行(000001)今日放量突破..."
```

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  questionType?: 'selection' | 'analysis' | 'learning' | 'general';
  relatedStocks?: string[];
}

interface AIConfig {
  hasApiKey: boolean;
  model: string;
  baseUrl: string;
}
```

### API Types

```typescript
// Standard error response for all APIs
interface APIError {
  success: false;
  error: { code: string; message: string };
}

// Chat API
interface ChatRequest {
  message: string;
  conversationId?: string;
  questionType?: 'selection' | 'analysis' | 'learning' | 'general';
  context?: {
    stocks?: string[];
    scanResults?: ScanResult[];
  };
}

interface ChatResponse {
  success: true;
  data: {
    content: string;
    relatedStocks?: string[];
    suggestedActions?: SuggestedAction[];
  };
}

// Config API
interface ConfigResponse {
  success: true;
  data: AIConfig;
}

interface ConfigRequest {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

// Migration API
interface MigrationRequest {
  watchlist: WatchlistItem[];
  positions: PositionItem[];
  alerts: AlertItem[];
}

interface MigrationResponse {
  success: true;
  data: {
    watchlist: number;
    positions: number;
    alerts: number;
  };
}
```

---

## State Management

### Zustand Store

```typescript
// store/aiStore.ts
import { create } from 'zustand';

interface AIStore {
  messages: Message[];
  isLoading: boolean;
  config: AIConfig;
  isConfigOpen: boolean;

  // Actions
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setConfig: (config: Partial<AIConfig>) => void;
  openConfig: () => void;
  closeConfig: () => void;
}

export const useAIStore = create<AIStore>((set) => ({
  messages: [],
  isLoading: false,
  config: { hasApiKey: false, model: 'qwen-plus', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  isConfigOpen: false,

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  clearMessages: () => set({ messages: [] }),

  setLoading: (loading) => set({ isLoading: loading }),

  setConfig: (config) => set((state) => ({
    config: { ...state.config, ...config }
  })),

  openConfig: () => set({ isConfigOpen: true }),
  closeConfig: () => set({ isConfigOpen: false }),
}));
```

---

## Backend Design

### API Routes

#### 1. AI Chat API
**Path:** `POST /api/ai/chat`

Request:
```typescript
interface ChatRequest {
  message: string;
  conversationId?: string;
  questionType?: 'selection' | 'analysis' | 'learning' | 'general';
  context?: {
    stocks?: string[]; // Related stock codes
    scanResults?: ScanResult[];
  };
}
```

Response:
```typescript
interface ChatResponse {
  success: boolean;
  data?: {
    content: string;
    relatedStocks?: string[];
    suggestedActions?: SuggestedAction[];
  };
  error?: { code: string; message: string };
}
```

Implementation:
- Retrieve encrypted API key from database
- Decrypt API key using AES-256-GCM
- Build system prompt with market context
- Call Alibaba Bailian API via OpenAI SDK
- Store conversation in database
- Return response

#### 2. AI Config API
**Path:** `GET/POST /api/ai/config`

GET Response:
```typescript
interface ConfigResponse {
  success: boolean;
  data?: {
    hasApiKey: boolean;
    model: string;
    baseUrl: string;
  };
}
```

POST Request:
```typescript
interface ConfigRequest {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}
```

#### 3. Database Migration API
**Path:** `POST /api/migrate`

Migrates all localStorage data to SQLite on first run.

#### 4. CRUD APIs
Standard REST endpoints for each table:
- `GET/POST /api/watchlist`
- `PUT/DELETE /api/watchlist/[id]`
- `GET/POST /api/positions`
- `PUT/DELETE /api/positions/[id]`
- `GET/POST /api/alerts`
- `PUT/DELETE /api/alerts/[id]`

### Encryption

API Key encryption using AES-256-GCM:

```typescript
// lib/encryption.ts
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Derive key from machine-specific secret
const SECRET_FILE = path.join(process.cwd(), 'data', '.secret');

function getMachineSecret(): string {
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, 'utf-8');
  }

  // Generate new secret on first run
  const secret = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
  fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
  return secret;
}

const ENCRYPTION_KEY = crypto.scryptSync(getMachineSecret(), 'stock-tracker-salt', 32);

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, dataHex] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf-8');
}
```

**IMPORTANT:** Add `data/.secret` to `.gitignore` to prevent committing the encryption key:

```gitignore
# .gitignore
data/
!data/.gitkeep
```

### System Prompt

The AI receives context about current market state:
```typescript
const systemPrompt = `你是专业的A股投资助手，帮助用户进行选股、分析和学习。

当前市场状态:
- 上证指数: ${indexData.sh} ${indexData.shChange}%
- 深证成指: ${indexData.sz} ${indexData.szChange}%
- 创业板指: ${indexData.cyb} ${indexData.cybChange}%
- 市场强度: 上涨${marketStats.upCount}家，下跌${marketStats.downCount}家
- 热门板块: ${hotSectors.map(s => s.name).join('、')}

用户自选股:
${watchlist.map(s => `- ${s.code} ${s.name} 现价${s.price} 涨跌${s.changePercent}%`).join('\n')}

回答原则:
1. 基于数据和事实分析
2. 给出明确的操作建议
3. 提示风险和不确定性
4. 推荐相关股票时给出理由`;
```

---

## Frontend Design

### Components Structure

```
components/ai/
├── index.ts                 # Exports
├── AIAssistant.tsx          # Main collapsible panel
├── AIAssistantHeader.tsx    # Header with title and collapse button
├── ChatHistory.tsx          # Message list
├── ChatMessage.tsx          # Single message bubble
├── ChatInput.tsx            # Input area with send button
├── QuickActions.tsx         # Quick action buttons
├── AIConfigPanel.tsx        # API key and model settings
├── SuggestedActionCard.tsx  # Actionable suggestion card
└── hooks/
    ├── useAIChat.ts         # Chat logic hook
    └── useAIConfig.ts       # Config management hook
```

### Main Component: AIAssistant

```tsx
// Position on homepage, below market sentiment
<div className="mt-4">
  <Collapsible open={isOpen} onOpenChange={setIsOpen}>
    <CollapsibleTrigger className="w-full">
      {/* Header: "AI选股助手" with collapse icon */}
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Card className="h-[400px] flex flex-col">
        {/* ChatHistory - scrollable, takes remaining space */}
        <ChatHistory messages={messages} />

        {/* QuickActions - show when input is empty */}
        {inputValue === '' && (
          <QuickActions onAction={handleQuickAction} />
        )}

        {/* ChatInput - fixed at bottom */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isLoading}
        />
      </Card>
    </CollapsibleContent>
  </Collapsible>
</div>
```

### Quick Actions

Four preset prompts:

1. **突破选股** - "帮我筛选近期突破20日新高的股票"
2. **量价配合** - "找出放量上涨且量价配合良好的股票"
3. **板块龙头** - "分析当前热门板块的龙头股机会"
4. **低估值龙头** - "筛选市盈率低于行业均值的龙头股"

### Chat Input

Features:
- Textarea with auto-resize (max 3 lines)
- Send button with loading state
- Enter to send, Shift+Enter for new line
- Character limit: 500 characters

### Chat History

Features:
- Scrollable container with auto-scroll to bottom
- Message bubbles: user (right, blue), assistant (left, gray)
- Timestamp display
- Stock codes are clickable links to stock detail page
- Loading skeleton while AI responds

### Stock Code Parsing

AI responses containing stock codes are parsed and rendered as clickable links:

```typescript
// components/ai/ChatMessage.tsx
import Link from 'next/link';

// Stock code validation: SH (6xx, 60x, 68x), SZ (00x, 30x, 15x)
function isValidStockCode(code: string): boolean {
  const cleanCode = code.replace(/^(sh|sz)/i, '');
  if (!/^\d{6}$/.test(cleanCode)) return false;

  // Shanghai: 600xxx-689xxx
  // Shenzhen: 000xxx-003xxx, 300xxx-301xxx, 150xxx-159xxx
  const prefix = cleanCode.substring(0, 2);
  const validPrefixes = ['60', '61', '62', '63', '68', '00', '30', '15'];
  return validPrefixes.includes(prefix);
}

function parseStockCodes(content: string): React.ReactNode[] {
  // Match patterns like:
  // - "平安银行(000001)" or "平安银行（000001）" (name + code in Chinese/English brackets)
  // - "000001" or "sz000001" or "sh600000" (code with optional prefix)
  const stockPattern = /(?:([^\s(（]+)[(（])?((?:sh|sz)?\d{6})[)）]?/gi;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = stockPattern.exec(content)) !== null) {
    // Validate it's actually a stock code
    if (!isValidStockCode(match[2])) {
      continue;
    }

    // Add text before match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const stockName = match[1];
    const stockCode = match[2];
    const displayText = stockName ? `${stockName}(${stockCode})` : stockCode;

    parts.push(
      <Link
        key={match.index}
        href={`/stock/${stockCode}`}
        className="text-primary hover:underline font-medium"
      >
        {displayText}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}
```

### AI Config Panel

Modal dialog for API configuration:
- API Key input (masked by default)
- Model selector (qwen-plus, qwen-turbo, qwen-max)
- Base URL (pre-filled, editable)
- Test connection button
- Save button

---

## Data Migration

### Migration Strategy

1. Check if database has data on page load
2. If database is empty, read from localStorage (client-side)
3. Send data to migration API endpoint
4. Clear localStorage after successful migration

### Migration Flow

```
Client (Browser)                    Server (Next.js API)
     |                                    |
     | 1. Check /api/watchlist            |
     |----------------------------------->|
     |                                    | Query SQLite
     | 2. Empty response                  |
     |<-----------------------------------|
     |                                    |
     | 3. Read localStorage               |
     |    - watchlist-stocks              |
     |    - position-store                |
     |    - alert-store                   |
     |                                    |
     | 4. POST /api/migrate               |
     |    { watchlist, positions, alerts }|
     |----------------------------------->|
     |                                    | Insert into SQLite
     | 5. Success response                |
     |<-----------------------------------|
     |                                    |
     | 6. Clear localStorage              |
     |                                    |
```

### Client-Side Migration Utility

```typescript
// lib/client/migration.ts
// NOTE: This file uses browser-only APIs (localStorage) and must only be imported in client components

export async function checkAndMigrate() {
  // Check if database has data
  const response = await fetch('/api/watchlist');
  const data = await response.json();

  if (data.data && data.data.length > 0) {
    return; // Already migrated
  }

  // Read from localStorage
  const watchlistData = localStorage.getItem('watchlist-stocks');
  const positionData = localStorage.getItem('position-store');
  const alertData = localStorage.getItem('alert-store');

  if (!watchlistData && !positionData && !alertData) {
    return; // No data to migrate
  }

  // Send to migration API
  const migrateResponse = await fetch('/api/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      watchlist: watchlistData ? JSON.parse(watchlistData) : [],
      positions: positionData ? JSON.parse(positionData).positions || [] : [],
      alerts: alertData ? JSON.parse(alertData).alerts || [] : [],
    }),
  });

  if (migrateResponse.ok) {
    // Clear localStorage after successful migration
    localStorage.removeItem('watchlist-stocks');
    localStorage.removeItem('position-store');
    localStorage.removeItem('alert-store');
  }
}
```

### Migration API

```typescript
// POST /api/migrate
// Request: MigrationRequest
// Response: MigrationResponse | APIError

export async function POST(request: Request) {
  const body = await request.json();

  const results = { watchlist: 0, positions: 0, alerts: 0 };

  // Insert watchlist items
  for (const item of body.watchlist) {
    db.prepare(`
      INSERT OR IGNORE INTO watchlist (code, name, group_name, added_at, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(item.code, item.name, item.groupName || '默认', item.addedAt || new Date().toISOString(), item.sortOrder || 0);
    results.watchlist++;
  }

  // Similar for positions and alerts...

  return Response.json({ success: true, data: results });
}
```

---

## Error Handling

### API Key Errors
- Missing API key: Show config modal with prompt
- Invalid API key: Display error message, prompt to re-enter
- Rate limit: Show retry countdown, auto-retry

### Network Errors
- Timeout: Retry with exponential backoff
- Connection error: Show offline message, queue message for retry

### Database Errors
- Write failure: Log and show user-friendly error
- Read failure: Fallback to cached data if available

---

## Testing Requirements

### Unit Tests
- API key encryption/decryption
- Database CRUD operations
- Message formatting utilities
- Quick action prompt generation

### Integration Tests
- AI chat API with mocked Bailian response
- Config save and load
- Data migration from localStorage

### E2E Tests
- Complete chat flow
- Config panel interaction
- Quick action execution

---

## Security Considerations

1. **API Key Storage**: Encrypted at rest using AES-256-GCM
2. **API Key Transmission**: Never sent to client, only used server-side
3. **SQL Injection**: Use parameterized queries (better-sqlite3 handles this)
4. **Input Validation**: Sanitize all user inputs
5. **Rate Limiting**: Implement per-IP rate limiting on AI endpoints

### Rate Limiting Implementation

```typescript
// lib/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

const RATE_LIMIT = {
  chat: { maxRequests: 20, windowMs: 60000 },      // 20 requests per minute
  config: { maxRequests: 5, windowMs: 60000 },     // 5 requests per minute
  migrate: { maxRequests: 3, windowMs: 3600000 },  // 3 requests per hour
};

export function checkRateLimit(
  request: NextRequest,
  endpoint: keyof typeof RATE_LIMIT
): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const key = `${ip}:${endpoint}`;
  const limit = RATE_LIMIT[endpoint];
  const now = Date.now();

  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + limit.windowMs });
    return null;
  }

  if (entry.count >= limit.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: `Too many requests. Retry after ${retryAfter} seconds.` } },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  entry.count++;
  return null;
}

// Usage in API route
export async function POST(request: NextRequest) {
  const rateLimitError = checkRateLimit(request, 'chat');
  if (rateLimitError) return rateLimitError;

  // ... rest of handler
}
```