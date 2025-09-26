# agent-spawning

Guide to spawning agents with Claude Code's Task tool and MCP coordination.

## Using Claude Code's Task Tool

**CRITICAL**: Always use Claude Code's Task tool for actual agent execution:

```javascript
// Spawn ALL agents in ONE message for concurrent execution
Task("Researcher", "Analyze requirements and write findings to memory", "researcher")
Task("Coder", "Implement features with memory coordination", "coder")
Task("Tester", "Create tests and report results", "tester")
Task("Reviewer", "Review code quality and share feedback", "reviewer")
```

## Available Agent Types

### Swarm Agents
- **hierarchical-coordinator** - Tree-structure command coordination
- **mesh-coordinator** - Peer-to-peer collaboration
- **adaptive-coordinator** - Dynamic topology adjustment

### Hive-Mind Agents (NEW)
- **queen-coordinator** - Sovereign orchestrator
- **collective-intelligence-coordinator** - Distributed cognition
- **swarm-memory-manager** - Memory coordination
- **worker-specialist** - Task execution
- **scout-explorer** - Reconnaissance

### Core Development
- **coder**, **reviewer**, **tester**, **planner**, **researcher**

### Specialized Agents
- **backend-dev**, **mobile-dev**, **ml-developer**
- **api-docs**, **system-architect**, **code-analyzer**
- **base-template-generator**, **cicd-engineer**

## MCP Coordination Setup (Optional)

MCP tools are ONLY for coordination topology:
```javascript
// Step 1: Initialize swarm topology
mcp__claude-flow__swarm_init { 
  topology: "hierarchical", 
  maxAgents: 10 
}

// Step 2: Define agent types for coordination
mcp__claude-flow__agent_spawn { type: "researcher" }
mcp__claude-flow__agent_spawn { type: "coder" }
```

## Memory Coordination Protocol

All spawned agents MUST write to memory:

```javascript
// MANDATORY pattern for every agent
mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/[agent-name]/status",
  namespace: "coordination",
  value: JSON.stringify({
    agent: "agent-name",
    status: "active",
    task: "current task",
    timestamp: Date.now()
  })
}
```

## Best Practices

1. **Always spawn agents concurrently** - Use ONE message
2. **Use Task tool for execution** - Claude Code handles real work
3. **MCP only for coordination** - Setup topology, not execution
4. **Batch all operations** - 300% performance improvement
5. **Memory writes are MANDATORY** - Agents must coordinate

## Example: Full Stack Development

```javascript
// Single message with ALL agents
[Concurrent Execution]:
  Task("Backend Developer", "Build REST API with memory coordination", "backend-dev")
  Task("Frontend Developer", "Create React UI, check memory for API", "coder")
  Task("Database Architect", "Design schema, store in memory", "code-analyzer")
  Task("Test Engineer", "Write tests, check memory for contracts", "tester")
  Task("DevOps Engineer", "Setup CI/CD, document in memory", "cicd-engineer")
  
  TodoWrite { todos: [...all todos...] }
  
  Write "backend/server.js"
  Write "frontend/App.jsx"
  Write "database/schema.sql"
```

## See Also
- `swarm-init` - Initialize swarm topology
- `hive-mind-spawn` - Spawn hive-mind agents
- `task-orchestrate` - Orchestrate complex tasks
- `agent-types` - List all available agents
