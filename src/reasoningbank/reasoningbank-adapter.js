/**
 * ReasoningBank Adapter for Claude-Flow
 *
 * Wraps agentic-flow's ReasoningBank SDK for use in claude-flow memory commands
 * Performance-optimized with caching, timeouts, and async embeddings
 */

import {  db, initialize, retrieveMemories, computeEmbedding, loadConfig } from 'agentic-flow/dist/reasoningbank/index.js';
import { v4 as uuidv4 } from 'uuid';

// Query result cache (LRU)
const queryCache = new Map();
const CACHE_SIZE = 100;
const CACHE_TTL = 60000; // 60 seconds

// Async embedding processing queue
const embeddingQueue = [];
let processingQueue = false;

/**
 * Initialize ReasoningBank database with performance optimizations
 */
export async function initializeReasoningBank() {
  // Set database path
  process.env.CLAUDE_FLOW_DB_PATH = '.swarm/memory.db';

  await initialize();
  await optimizeDatabase();
  return true;
}

/**
 * Add database indexes for query performance
 */
async function optimizeDatabase() {
  try {
    const dbInstance = db.getDb();

    // Add indexes for common queries
    dbInstance.exec(`
      -- Index on confidence for sorting
      CREATE INDEX IF NOT EXISTS idx_patterns_confidence
      ON patterns(confidence DESC);

      -- Index on usage_count for sorting
      CREATE INDEX IF NOT EXISTS idx_patterns_usage
      ON patterns(usage_count DESC);

      -- Index on created_at for time-based queries
      CREATE INDEX IF NOT EXISTS idx_patterns_created
      ON patterns(created_at DESC);

      -- Index on memory_id for embeddings lookup
      CREATE INDEX IF NOT EXISTS idx_embeddings_memory
      ON pattern_embeddings(memory_id);
    `);
  } catch (error) {
    console.warn('[ReasoningBank] Failed to create indexes:', error.message);
  }
}

/**
 * Store a memory in ReasoningBank (optimized with async embeddings)
 */
export async function storeMemory(key, value, options = {}) {
  const memoryId = `mem_${uuidv4()}`;

  const memory = {
    id: memoryId,
    type: options.type || 'fact',
    pattern_data: JSON.stringify({
      key,
      value,
      namespace: options.namespace || 'default',
      agent: options.agent || 'memory-agent',
      domain: options.domain || 'general',
    }),
    confidence: options.confidence || 0.8,
    usage_count: 0,
    created_at: new Date().toISOString(),
  };

  // Store memory immediately (fast, no blocking)
  db.upsertMemory(memory);

  // Invalidate query cache when new memory is added
  queryCache.clear();

  // Queue embedding computation for background processing (unless disabled)
  if (options.async !== false) {
    embeddingQueue.push({ memoryId, key, value });
    processEmbeddingQueue(); // Non-blocking
  } else {
    // Synchronous mode for critical operations
    await computeAndStoreEmbedding(memoryId, key, value);
  }

  return memoryId;
}

/**
 * Process embedding queue in background
 */
async function processEmbeddingQueue() {
  if (processingQueue || embeddingQueue.length === 0) return;

  processingQueue = true;

  while (embeddingQueue.length > 0) {
    const batch = embeddingQueue.splice(0, 5); // Process 5 at a time

    await Promise.allSettled(
      batch.map(({ memoryId, key, value }) =>
        computeAndStoreEmbedding(memoryId, key, value)
      )
    );
  }

  processingQueue = false;
}

/**
 * Compute and store embedding for a memory
 */
async function computeAndStoreEmbedding(memoryId, key, value) {
  try {
    const config = loadConfig();
    const embeddingModel = config.embeddings.provider || 'claude';

    const embedding = await computeEmbedding(`${key}: ${value}`);
    const vectorArray = new Float32Array(embedding);

    db.upsertEmbedding({
      memory_id: memoryId,
      vector: vectorArray,
      model: embeddingModel,
      dims: vectorArray.length,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn(`[ReasoningBank] Failed to compute embedding for ${memoryId}:`, error.message);
  }
}

/**
 * Query memories from ReasoningBank (optimized with caching and timeout)
 */
export async function queryMemories(searchQuery, options = {}) {
  // Check cache first
  const cached = getCachedQuery(searchQuery, options);
  if (cached) {
    return cached;
  }

  const timeout = options.timeout || 3000; // 3s default timeout

  try {
    // Race between semantic search and timeout
    const memories = await Promise.race([
      retrieveMemories(searchQuery, {
        domain: options.domain || 'general',
        agent: options.agent || 'memory-agent',
        k: options.limit || 10,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ]);

    const results = memories.map(mem => {
      try {
        const data = JSON.parse(mem.pattern_data);
        return {
          id: mem.id,
          key: data.key,
          value: data.value,
          namespace: data.namespace,
          confidence: mem.confidence,
          usage_count: mem.usage_count,
          created_at: mem.created_at,
          score: mem.score || 0,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    // If semantic search returns no results, try SQL fallback
    // (handles case where embeddings don't exist yet)
    if (results.length === 0) {
      console.warn('[ReasoningBank] Semantic search returned 0 results, trying SQL fallback');
      const fallbackResults = await queryMemoriesFast(searchQuery, options);
      setCachedQuery(searchQuery, options, fallbackResults);
      return fallbackResults;
    }

    // Cache successful results
    setCachedQuery(searchQuery, options, results);
    return results;
  } catch (error) {
    // Fast SQL fallback on timeout or error
    console.warn('[ReasoningBank] Using fast SQL fallback:', error.message);
    const results = await queryMemoriesFast(searchQuery, options);

    // Cache fallback results too
    setCachedQuery(searchQuery, options, results);
    return results;
  }
}

/**
 * Fast SQL-based query fallback (optimized)
 */
async function queryMemoriesFast(searchQuery, options = {}) {
  const dbInstance = db.getDb();
  const limit = options.limit || 10;
  const namespace = options.namespace;

  // Use optimized query with indexes
  let query = `
    SELECT
      id,
      pattern_data,
      confidence,
      usage_count,
      created_at
    FROM patterns
    WHERE 1=1
  `;

  const params = [];

  // Add namespace filter if provided
  if (namespace) {
    query += ` AND pattern_data LIKE ?`;
    params.push(`%"namespace":"${namespace}"%`);
  }

  // Add search filter - check both key and value
  query += ` AND (
    pattern_data LIKE ? OR
    pattern_data LIKE ?
  )`;
  params.push(`%"key":"%${searchQuery}%"%`, `%"value":"%${searchQuery}%"%`);

  // Use indexed sort
  query += ` ORDER BY confidence DESC, usage_count DESC LIMIT ?`;
  params.push(limit);

  const rows = dbInstance.prepare(query).all(...params);

  return rows.map(row => {
    try {
      const data = JSON.parse(row.pattern_data);
      return {
        id: row.id,
        key: data.key,
        value: data.value,
        namespace: data.namespace,
        confidence: row.confidence,
        usage_count: row.usage_count,
        created_at: row.created_at,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Get cached query results
 */
function getCachedQuery(searchQuery, options) {
  const cacheKey = JSON.stringify({ searchQuery, options });
  const cached = queryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }

  return null;
}

/**
 * Set cached query results (LRU eviction)
 */
function setCachedQuery(searchQuery, options, results) {
  const cacheKey = JSON.stringify({ searchQuery, options });

  // LRU eviction
  if (queryCache.size >= CACHE_SIZE) {
    const firstKey = queryCache.keys().next().value;
    queryCache.delete(firstKey);
  }

  queryCache.set(cacheKey, {
    results,
    timestamp: Date.now()
  });
}

/**
 * List all memories
 */
export async function listMemories(options = {}) {
  const dbInstance = db.getDb();

  const limit = options.limit || 10;
  const sortBy = options.sort || 'created_at';
  const sortOrder = options.order || 'DESC';

  const rows = dbInstance.prepare(`
    SELECT * FROM patterns
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ?
  `).all(limit);

  return rows.map(row => {
    try {
      const data = JSON.parse(row.pattern_data);
      return {
        id: row.id,
        key: data.key,
        value: data.value,
        namespace: data.namespace,
        confidence: row.confidence,
        usage_count: row.usage_count,
        created_at: row.created_at,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Get ReasoningBank statistics
 */
export async function getStatus() {
  const dbInstance = db.getDb();

  const stats = dbInstance.prepare(`
    SELECT
      COUNT(*) as total_memories,
      AVG(confidence) as avg_confidence,
      SUM(usage_count) as total_usage
    FROM patterns
  `).get();

  const embeddingCount = dbInstance.prepare(`
    SELECT COUNT(*) as count FROM pattern_embeddings
  `).get();

  const trajectoryCount = dbInstance.prepare(`
    SELECT COUNT(*) as count FROM task_trajectories
  `).get();

  return {
    total_memories: stats.total_memories || 0,
    avg_confidence: stats.avg_confidence || 0,
    total_usage: stats.total_usage || 0,
    total_embeddings: embeddingCount.count || 0,
    total_trajectories: trajectoryCount.count || 0,
  };
}

/**
 * Check which ReasoningBank tables are present in the database
 * Returns object with table names and their existence status
 */
export async function checkReasoningBankTables() {
  try {
    const dbInstance = db.getDb();

    // Required ReasoningBank tables
    const requiredTables = [
      'patterns',
      'pattern_embeddings',
      'pattern_links',
      'task_trajectories',
      'matts_runs',
      'consolidation_runs',
      'metrics_log'
    ];

    // Query existing tables
    const existingTables = dbInstance.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table'
    `).all().map(row => row.name);

    // Check which required tables are missing
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    return {
      exists: missingTables.length === 0,
      existingTables,
      missingTables,
      requiredTables
    };
  } catch (error) {
    return {
      exists: false,
      existingTables: [],
      missingTables: [],
      requiredTables: [],
      error: error.message
    };
  }
}

/**
 * Migrate existing database to add missing ReasoningBank tables
 */
export async function migrateReasoningBank() {
  try {
    // Check current state
    const tableCheck = await checkReasoningBankTables();

    if (tableCheck.exists) {
      return {
        success: true,
        message: 'All ReasoningBank tables already exist',
        migrated: false
      };
    }

    // Run full initialization which will create missing tables
    await initializeReasoningBank();

    // Verify migration
    const afterCheck = await checkReasoningBankTables();

    return {
      success: afterCheck.exists,
      message: `Migration completed: ${tableCheck.missingTables.length} tables added`,
      migrated: true,
      addedTables: tableCheck.missingTables
    };
  } catch (error) {
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      error: error.message
    };
  }
}
