# memory-usage

Manage persistent memory storage using MCP tools with the coordination namespace.

## Usage
```bash
npx claude-flow memory usage [options]
```

## Options
- `--action <type>` - Action (store, retrieve, list, delete, search)
- `--key <key>` - Memory key
- `--value <data>` - Data to store (JSON)
- `--namespace <ns>` - Namespace (default: coordination)

## MCP Tool Usage

**IMPORTANT**: All memory operations use the "coordination" namespace for agent synchronization.

```javascript
// Store data in memory
mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/agent-name/status",
  namespace: "coordination",
  value: JSON.stringify({
    status: "active",
    task: "current task",
    timestamp: Date.now()
  })
}

// Retrieve from memory
mcp__claude-flow__memory_usage {
  action: "retrieve",
  key: "swarm/agent-name/status",
  namespace: "coordination"
}

// Search memory with pattern
mcp__claude-flow__memory_search {
  pattern: "swarm/*",
  namespace: "coordination",
  limit: 10
}

// List all keys
mcp__claude-flow__memory_usage {
  action: "list",
  namespace: "coordination"
}
```

## Mandatory Coordination Protocol

All agents MUST follow this 5-step memory pattern:

1. **STATUS** - Write agent status on startup
2. **PROGRESS** - Update progress every 30-60 seconds
3. **SHARE** - Share discoveries/decisions immediately
4. **CHECK** - Read shared memory for coordination
5. **COMPLETE** - Report task completion

## Key Structure Convention

```
swarm/[agent-name]/status       - Agent status
swarm/[agent-name]/progress     - Current progress
swarm/[agent-name]/complete     - Completion status
swarm/shared/[data-type]        - Shared data
swarm/shared/dependencies       - Dependency tracking
swarm/shared/discoveries        - Shared findings
```

## Examples

### Store Agent Status
```bash
npx claude-flow memory usage --action store --key "swarm/coder-1/status" --value '{"status": "active", "task": "implementing API"}'
```

### Retrieve Shared Dependencies
```bash
npx claude-flow memory usage --action retrieve --key "swarm/shared/dependencies"
```

### Search for All Agent Statuses
```bash
npx claude-flow memory search --pattern "swarm/*/status"
```

### List All Coordination Keys
```bash
npx claude-flow memory usage --action list --namespace coordination
```

## Integration with Agents

When agents are spawned, they automatically use memory for coordination:

```javascript
Task("Coder", "Implement feature and write status to memory", "coder")
// Agent will automatically:
// 1. Write status to swarm/coder/status
// 2. Update progress to swarm/coder/progress
// 3. Share results to swarm/shared/code
// 4. Check dependencies from swarm/shared/dependencies
// 5. Write completion to swarm/coder/complete
```

## See Also
- `memory-search` - Search memory with patterns
- `memory-persist` - Cross-session persistence
- `hive-mind-memory` - Distributed memory management
- `swarm-init` - Initialize with memory enabled
