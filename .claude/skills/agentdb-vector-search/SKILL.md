---
name: "AgentDB Vector Search"
description: "Implement semantic vector search with AgentDB for intelligent document retrieval, similarity matching, and context-aware querying. Use when building RAG systems, semantic search engines, or intelligent knowledge bases."
---

# AgentDB Vector Search

## What This Skill Does

Implements vector-based semantic search using AgentDB's high-performance vector database with 150x-12,500x faster operations than traditional solutions. Enables similarity search, hybrid search (vector + metadata), and real-time embedding generation.

## Prerequisites

- agentic-flow v1.5.11+ or agentdb v1.0.4+
- Node.js 18+
- OpenAI API key (for embeddings) or custom embedding model

## Quick Start

```typescript
import { AgentDB } from 'agentdb';

// Initialize AgentDB with vector support
const db = new AgentDB({
  persist: true,
  vectorDimensions: 1536, // OpenAI ada-002 dimensions
  enableVectorIndex: true
});

// Store documents with vectors
await db.storeMemory({
  text: "The quantum computer achieved 100 qubits",
  metadata: { category: "technology", date: "2025-01-15" },
  embedding: await generateEmbedding(text) // Your embedding function
});

// Semantic search
const results = await db.searchSimilar(
  queryEmbedding,
  { limit: 10, threshold: 0.7 }
);
```

## Core Features

### 1. Vector Storage
```typescript
// Store with automatic embedding
await db.storeWithEmbedding({
  content: "Your document text",
  metadata: { source: "docs", page: 42 }
});
```

### 2. Similarity Search
```typescript
// Find similar documents
const similar = await db.findSimilar("quantum computing", {
  limit: 5,
  minScore: 0.75
});
```

### 3. Hybrid Search (Vector + Metadata)
```typescript
// Combine vector similarity with metadata filtering
const results = await db.hybridSearch({
  query: "machine learning models",
  filters: {
    category: "research",
    date: { $gte: "2024-01-01" }
  },
  limit: 20
});
```

## Advanced Usage

### RAG (Retrieval Augmented Generation)
```typescript
// Build RAG pipeline
async function ragQuery(question: string) {
  // 1. Get relevant context
  const context = await db.searchSimilar(
    await embed(question),
    { limit: 5, threshold: 0.7 }
  );

  // 2. Generate answer with context
  const prompt = `Context: ${context.map(c => c.text).join('\n')}
Question: ${question}`;

  return await llm.generate(prompt);
}
```

### Batch Operations
```typescript
// Efficient batch storage
await db.batchStore(documents.map(doc => ({
  text: doc.content,
  embedding: doc.vector,
  metadata: doc.meta
})));
```

## Performance Tips

- **Indexing**: Enable vector index for 10-100x faster searches
- **Batch Size**: Use batch operations for 1000+ documents
- **Dimensions**: Match embedding model (1536 for OpenAI ada-002)
- **Threshold**: Start at 0.7 for quality results

## Troubleshooting

### Issue: Slow search performance
**Solution**: Enable vector index: `enableVectorIndex: true`

### Issue: Poor relevance
**Solution**: Adjust similarity threshold or use hybrid search

## Learn More

- AgentDB Docs: packages/agentdb/README.md
- Vector DB API: packages/agentdb/docs/vector-api.md
- Performance Guide: docs/agentdb/performance.md
