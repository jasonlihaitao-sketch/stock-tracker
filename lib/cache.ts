/**
 * 内存缓存工具类
 * 用于减少重复的 API 请求
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class DataCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()

  /**
   * 获取缓存数据
   * @param key 缓存键
   * @returns 缓存数据，如果不存在或已过期则返回 null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // 缓存已过期，删除并返回 null
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 缓存过期时间（毫秒）
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * 删除指定缓存
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 清理所有过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * 获取缓存统计信息
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// 导出单例实例
export const dataCache = new DataCache()

// 定期清理过期缓存（每 5 分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    dataCache.cleanup()
  }, 5 * 60 * 1000)
}