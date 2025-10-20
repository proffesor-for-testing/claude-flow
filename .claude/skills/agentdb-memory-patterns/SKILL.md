---
name: "AgentDB Memory Patterns"
description: "Implement persistent memory patterns for AI agents using AgentDB. Includes session memory, long-term storage, pattern learning, and context management. Use when building stateful agents, chat systems, or intelligent assistants."
---

# AgentDB Memory Patterns

## What This Skill Does

Provides memory management patterns for AI agents using AgentDB's persistent storage and ReasoningBank integration. Enables agents to remember conversations, learn from interactions, and maintain context across sessions.

## Prerequisites

- agentic-flow v1.5.11+ or agentdb v1.0.4+
- Node.js 18+
- Understanding of agent architectures

## Quick Start

```typescript
import { AgentDB, MemoryManager } from 'agentdb';

// Initialize memory system
const memory = new MemoryManager({
  agentId: 'assistant-001',
  persist: true,
  ttl: 3600 * 24 * 30 // 30 days
});

// Store interaction
await memory.store({
  role: 'user',
  content: 'What is the capital of France?',
  timestamp: Date.now()
});

await memory.store({
  role: 'assistant',
  content: 'The capital of France is Paris.',
  timestamp: Date.now()
});

// Retrieve context
const context = await memory.getRecentContext({ limit: 10 });
```

## Memory Patterns

### 1. Session Memory
```typescript
class SessionMemory {
  async storeMessage(role: string, content: string) {
    return await db.storeMemory({
      sessionId: this.sessionId,
      role,
      content,
      timestamp: Date.now()
    });
  }

  async getSessionHistory(limit = 20) {
    return await db.query({
      filters: { sessionId: this.sessionId },
      orderBy: 'timestamp',
      limit
    });
  }
}
```

### 2. Long-Term Memory
```typescript
// Store important facts
await db.storeFact({
  category: 'user_preference',
  key: 'language',
  value: 'English',
  confidence: 1.0,
  source: 'explicit'
});

// Retrieve facts
const prefs = await db.getFacts({
  category: 'user_preference'
});
```

### 3. Pattern Learning
```typescript
// Learn from successful interactions
await db.storePattern({
  trigger: 'user_asks_time',
  response: 'provide_formatted_time',
  success: true,
  context: { timezone: 'UTC' }
});

// Apply learned patterns
const pattern = await db.matchPattern(currentContext);
```

## Advanced Patterns

### Hierarchical Memory
```typescript
// Organize memory in hierarchy
await memory.organize({
  immediate: recentMessages,    // Last 10 messages
  shortTerm: sessionContext,    // Current session
  longTerm: importantFacts,     // Persistent facts
  semantic: embeddedKnowledge   // Vector search
});
```

### Memory Consolidation
```typescript
// Periodically consolidate memories
await memory.consolidate({
  strategy: 'importance',       // Keep important memories
  maxSize: 10000,              // Size limit
  minScore: 0.5                // Relevance threshold
});
```

## Integration with ReasoningBank

```typescript
import { ReasoningBank } from 'agentic-flow/reasoningbank';

// Connect memory to reasoning
const rb = new ReasoningBank({
  memory: memory,
  learningRate: 0.1
});

// Learn from outcomes
await rb.recordOutcome({
  task: 'summarize_document',
  approach: 'extractive',
  success: true,
  metrics: { accuracy: 0.95 }
});

// Get optimal strategy
const strategy = await rb.getOptimalStrategy('summarize_document');
```

## Best Practices

1. **Prune regularly**: Remove outdated or low-value memories
2. **Use TTL**: Set time-to-live for ephemeral data
3. **Index metadata**: Enable fast filtering by sessionId, userId
4. **Compress old data**: Archive infrequently accessed memories

## Troubleshooting

### Issue: Memory growing too large
**Solution**: Enable auto-pruning or set TTL values

### Issue: Context not relevant
**Solution**: Use vector search for semantic memory retrieval

## Learn More

- Memory API: packages/agentdb/docs/memory-api.md
- ReasoningBank: agentic-flow/src/reasoningbank/README.md
