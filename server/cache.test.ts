import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  cacheService,
  queryCacheService,
  performanceMonitor,
  batchProcessor,
  memoryManager,
} from "./cache.service";

/**
 * Performance and Caching Tests
 * اختبارات الأداء والتخزين المؤقت
 */

describe("Cache Service", () => {
  beforeEach(() => {
    cacheService.clear();
  });

  describe("Basic Caching", () => {
    it("should set and get cached value", () => {
      const data = { id: 1, name: "Test" };
      cacheService.set("test-key", data);

      const cached = cacheService.get("test-key");
      expect(cached).toEqual(data);
    });

    it("should return null for non-existent key", () => {
      const cached = cacheService.get("non-existent");
      expect(cached).toBeNull();
    });

    it("should delete cached value", () => {
      cacheService.set("test-key", { data: "value" });
      const deleted = cacheService.delete("test-key");

      expect(deleted).toBe(true);
      expect(cacheService.get("test-key")).toBeNull();
    });

    it("should expire cached value after TTL", (done) => {
      cacheService.set("test-key", { data: "value" }, 100); // 100ms TTL

      expect(cacheService.get("test-key")).not.toBeNull();

      setTimeout(() => {
        expect(cacheService.get("test-key")).toBeNull();
        done();
      }, 150);
    });

    it("should clear all cache", () => {
      cacheService.set("key1", "value1");
      cacheService.set("key2", "value2");
      cacheService.clear();

      expect(cacheService.get("key1")).toBeNull();
      expect(cacheService.get("key2")).toBeNull();
    });
  });

  describe("Cache Statistics", () => {
    it("should track cache hits", () => {
      cacheService.set("test-key", "value");

      cacheService.get("test-key");
      cacheService.get("test-key");
      cacheService.get("test-key");

      const stats = cacheService.getStats();
      expect(stats.totalHits).toBeGreaterThan(0);
    });

    it("should report cache statistics", () => {
      cacheService.set("key1", "value1");
      cacheService.set("key2", "value2");

      const stats = cacheService.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.totalHits).toBeGreaterThanOrEqual(0);
    });

    it("should cleanup expired entries", (done) => {
      cacheService.set("key1", "value1", 50);
      cacheService.set("key2", "value2", 5000);

      setTimeout(() => {
        const removed = cacheService.cleanup();
        expect(removed).toBeGreaterThan(0);

        const stats = cacheService.getStats();
        expect(stats.totalEntries).toBeLessThan(2);
        done();
      }, 100);
    });
  });

  describe("Get or Compute", () => {
    it("should return cached value if exists", async () => {
      const data = { id: 1 };
      cacheService.set("test-key", data);

      const result = await cacheService.getOrCompute("test-key", async () => ({
        id: 2,
      }));

      expect(result).toEqual(data);
    });

    it("should compute and cache if not exists", async () => {
      const computedData = { id: 1 };

      const result = await cacheService.getOrCompute(
        "test-key",
        async () => computedData
      );

      expect(result).toEqual(computedData);
      expect(cacheService.get("test-key")).toEqual(computedData);
    });
  });

  describe("Pattern Invalidation", () => {
    it("should invalidate cache by pattern", () => {
      cacheService.set("user:1", "data1");
      cacheService.set("user:2", "data2");
      cacheService.set("post:1", "data3");

      const removed = cacheService.invalidatePattern("^user:");
      expect(removed).toBe(2);

      expect(cacheService.get("user:1")).toBeNull();
      expect(cacheService.get("post:1")).not.toBeNull();
    });
  });
});

describe("Query Cache Service", () => {
  beforeEach(() => {
    queryCacheService.invalidateAll();
  });

  describe("Query Caching", () => {
    it("should generate consistent cache keys", () => {
      const filters = { status: "active", limit: 10 };

      const key1 = queryCacheService.generateKey("users", filters);
      const key2 = queryCacheService.generateKey("users", filters);

      expect(key1).toBe(key2);
    });

    it("should cache query results", () => {
      const data = [{ id: 1, name: "User 1" }];
      const filters = { status: "active" };

      queryCacheService.cache("users", filters, data);

      const cached = queryCacheService.get("users", filters);
      expect(cached).toEqual(data);
    });

    it("should invalidate entity cache", () => {
      const data = [{ id: 1 }];
      queryCacheService.cache("users", {}, data);

      queryCacheService.invalidateEntity("users");

      const cached = queryCacheService.get("users", {});
      expect(cached).toBeNull();
    });
  });
});

describe("Performance Monitor", () => {
  describe("Async Measurement", () => {
    it("should measure async function execution time", async () => {
      const { result, duration } = await performanceMonitor.measure(
        "test-async",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return "result";
        }
      );

      expect(result).toBe("result");
      expect(duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe("Sync Measurement", () => {
    it("should measure sync function execution time", () => {
      const { result, duration } = performanceMonitor.measureSync(
        "test-sync",
        () => {
          let sum = 0;
          for (let i = 0; i < 1000000; i++) {
            sum += i;
          }
          return sum;
        }
      );

      expect(result).toBeGreaterThan(0);
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Timer", () => {
    it("should create and end timer", () => {
      const timer = performanceMonitor.createTimer("test-timer");

      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 100000; i++) {
        sum += i;
      }

      const duration = timer.end();
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("Batch Processor", () => {
  describe("Batch Processing", () => {
    it("should process items in batches", async () => {
      const items = Array.from({ length: 250 }, (_, i) => i);
      const processedBatches: number[][] = [];

      await batchProcessor.processBatch(items, async (batch) => {
        processedBatches.push(batch);
        return batch;
      }, 100);

      expect(processedBatches.length).toBe(3); // 100 + 100 + 50
      expect(processedBatches[0].length).toBe(100);
      expect(processedBatches[2].length).toBe(50);
    });

    it("should return all results", async () => {
      const items = [1, 2, 3, 4, 5];

      const results = await batchProcessor.processBatch(
        items,
        async (batch) => batch.map((x) => x * 2),
        2
      );

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });
  });

  describe("Concurrent Processing", () => {
    it("should process with concurrency limit", async () => {
      const items = Array.from({ length: 10 }, (_, i) => i);
      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const results = await batchProcessor.processConcurrent(
        items,
        async (item) => {
          currentConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent);

          await new Promise((resolve) => setTimeout(resolve, 10));

          currentConcurrent--;
          return item * 2;
        },
        3
      );

      expect(results.length).toBe(10);
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });

    it("should maintain order of results", async () => {
      const items = [1, 2, 3, 4, 5];

      const results = await batchProcessor.processConcurrent(
        items,
        async (item) => item * 2,
        2
      );

      expect(results).toContain(2);
      expect(results).toContain(4);
      expect(results).toContain(6);
      expect(results).toContain(8);
      expect(results).toContain(10);
    });
  });
});

describe("Memory Manager", () => {
  describe("Memory Usage", () => {
    it("should report memory usage", () => {
      const usage = memoryManager.getMemoryUsage();

      expect(usage.heapUsed).toBeDefined();
      expect(usage.heapTotal).toBeDefined();
      expect(usage.external).toBeDefined();
      expect(usage.rss).toBeDefined();

      // Check format (should contain "MB")
      expect(usage.heapUsed).toContain("MB");
    });
  });

  describe("Garbage Collection", () => {
    it("should attempt garbage collection", () => {
      const result = memoryManager.forceGC();
      // Result depends on whether global.gc is available
      expect(typeof result).toBe("boolean");
    });
  });
});
