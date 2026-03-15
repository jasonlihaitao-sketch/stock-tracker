export interface WatchlistGroup {
  id: string
  name: string
  stockCodes: string[]
  createdAt: string
  updatedAt: string
}

export type GroupAction = 'create' | 'edit' | 'delete' | 'moveStock'

export interface MoveStockToGroupParams {
  stockCode: string
  fromGroupId: string | null
  toGroupId: string | null
}
