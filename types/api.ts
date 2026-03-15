// API 响应格式
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}