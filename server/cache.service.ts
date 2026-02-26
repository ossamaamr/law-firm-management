/**
 * Caching Service
 * خدمة التخزين المؤقت
 */

/**
 * In-memory cache store
 * متجر التخزين المؤقت في الذاكرة
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  hits: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();

/**
 * Cache Service
 * خدمة التخزين المؤقت
 */
export const cacheService = {
  /**
   * Get cached value
   * الحصول على القيمة المخزنة مؤقتاً
   */
  get<T>(key: string): T | null {
    const entry = cacheStore.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cacheStore.delete(key);
      return null;
    }

    // Increment hit count
    entry.hits++;

    return entry.data as T;
  },

  /**
   * Set cached value
   * تعيين القيمة المخزنة مؤقتاً
   */
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    cacheStore.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      hits: 0,
    });
  },

  /**
   * Delete cached value
   * حذف القيمة المخزنة مؤقتاً
   */
  delete(key: string): boolean {
    return cacheStore.delete(key);
  },

  /**
   * Clear all cache
   * مسح جميع التخزين المؤقت
   */
  clear(): void {
    cacheStore.clear();
  },

  /**
   * Get cache statistics
   * الحصول على إحصائيات التخزين المؤقت
   */
  getStats() {
    let totalHits = 0;
    let totalEntries = 0;
    let expiredEntries = 0;

    for (const [, entry] of cacheStore.entries()) {
      totalEntries++;
      totalHits += entry.hits;

      if (Date.now() > entry.expiresAt) {
        expiredEntries++;
      }
    }

    return {
      totalEntries,
      totalHits,
      expiredEntries,
      hitRate: totalEntries > 0 ? (totalHits / totalEntries).toFixed(2) : '0',
    };
  },

  /**
   * Clean up expired entries
   * تنظيف الإدخالات المنتهية
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of cacheStore.entries()) {
      if (now > entry.expiresAt) {
        cacheStore.delete(key);
        removed++;
      }
    }

    return removed;
  },

  /**
   * Get or compute cached value
   * الحصول على أو حساب القيمة المخزنة مؤقتاً
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttlMs: number = 60000
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await compute();
    this.set(key, data, ttlMs);
    return data;
  },

  /**
   * Invalidate cache pattern
   * إلغاء نمط التخزين المؤقت
   */
  invalidatePattern(pattern: string): number {
    let removed = 0;
    const regex = new RegExp(pattern);

    for (const key of cacheStore.keys()) {
      if (regex.test(key)) {
        cacheStore.delete(key);
        removed++;
      }
    }

    return removed;
  },
};

/**
 * Query result caching
 * تخزين نتائج الاستعلام مؤقتاً
 */
export const queryCacheService = {
  /**
   * Generate cache key for query
   * إنشاء مفتاح التخزين المؤقت للاستعلام
   */
  generateKey(
    entity: string,
    filters: Record<string, any>,
    options?: Record<string, any>
  ): string {
    const filterStr = JSON.stringify(filters);
    const optionsStr = JSON.stringify(options || {});
    return `query:${entity}:${Buffer.from(filterStr + optionsStr).toString('base64')}`;
  },

  /**
   * Cache query result
   * تخزين نتيجة الاستعلام مؤقتاً
   */
  cache<T>(
    entity: string,
    filters: Record<string, any>,
    data: T,
    ttlMs: number = 300000 // 5 minutes
  ): void {
    const key = this.generateKey(entity, filters);
    cacheService.set(key, data, ttlMs);
  },

  /**
   * Get cached query result
   * الحصول على نتيجة الاستعلام المخزنة مؤقتاً
   */
  get<T>(
    entity: string,
    filters: Record<string, any>
  ): T | null {
    const key = this.generateKey(entity, filters);
    return cacheService.get<T>(key);
  },

  /**
   * Invalidate query cache for entity
   * إلغاء تخزين الاستعلام المؤقت للكيان
   */
  invalidateEntity(entity: string): number {
    return cacheService.invalidatePattern(`query:${entity}:`);
  },

  /**
   * Invalidate all query cache
   * إلغاء جميع تخزين الاستعلام المؤقت
   */
  invalidateAll(): void {
    cacheService.clear();
  },
};

/**
 * Performance monitoring
 * مراقبة الأداء
 */
export const performanceMonitor = {
  /**
   * Measure execution time
   * قياس وقت التنفيذ
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);

    return { result, duration };
  },

  /**
   * Measure sync function
   * قياس دالة متزامنة
   */
  measureSync<T>(
    name: string,
    fn: () => T
  ): { result: T; duration: number } {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);

    return { result, duration };
  },

  /**
   * Create a timer
   * إنشاء مؤقت
   */
  createTimer(name: string) {
    const start = performance.now();

    return {
      end: () => {
        const duration = performance.now() - start;
        console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
        return duration;
      },
    };
  },
};

/**
 * Batch processing
 * معالجة دفعية
 */
export const batchProcessor = {
  /**
   * Process items in batches
   * معالجة العناصر في دفعات
   */
  async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }

    return results;
  },

  /**
   * Process with concurrency limit
   * معالجة مع حد التزامن
   */
  async processConcurrent<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number = 5
  ): Promise<R[]> {
    const results: R[] = [];
    const queue = [...items];

    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item) {
          const result = await processor(item);
          results.push(result);
        }
      }
    };

    const workers = Array(Math.min(concurrency, items.length))
      .fill(null)
      .map(() => worker());

    await Promise.all(workers);

    return results;
  },
};

/**
 * Memory management
 * إدارة الذاكرة
 */
export const memoryManager = {
  /**
   * Get memory usage
   * الحصول على استخدام الذاكرة
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    };
  },

  /**
   * Force garbage collection
   * فرض جمع القمامة
   */
  forceGC() {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  },

  /**
   * Monitor memory leaks
   * مراقبة تسريب الذاكرة
   */
  monitorLeaks(interval: number = 60000) {
    let previousUsage = process.memoryUsage().heapUsed;

    setInterval(() => {
      const currentUsage = process.memoryUsage().heapUsed;
      const diff = currentUsage - previousUsage;

      if (diff > 0) {
        console.warn(
          `[MEMORY] Potential leak: +${(diff / 1024 / 1024).toFixed(2)} MB`
        );
      }

      previousUsage = currentUsage;
    }, interval);
  },
};
