'use client'

import { TradeActions } from '@/components/trade'
import type { Stock } from '@/types/stock'

interface StockTradeActionsProps {
  stock: Stock
}

export function StockTradeActions({ stock }: StockTradeActionsProps) {
  return <TradeActions stock={stock} />
}