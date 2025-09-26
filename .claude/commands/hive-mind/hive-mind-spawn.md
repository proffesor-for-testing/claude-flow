# hive-mind-spawn

Spawn a Hive Mind swarm with queen-led coordination and mandatory memory coordination.

## Usage
```bash
npx claude-flow hive-mind spawn <objective> [options]
```

## Options
- `--queen-type <type>` - Queen type (strategic, tactical, adaptive)
- `--max-workers <n>` - Maximum worker agents
- `--consensus <type>` - Consensus algorithm
- `--claude` - Generate Claude Code spawn commands

## Available Hive-Mind Agents

### Core Hive-Mind Agents
- **queen-coordinator** - Sovereign orchestrator for hierarchical operations
- **collective-intelligence-coordinator** - Distributed cognitive processing
- **swarm-memory-manager** - Distributed memory and cache management
- **worker-specialist** - Task execution with continuous progress reporting
- **scout-explorer** - Information reconnaissance and threat detection

## MCP Tool Usage

```javascript
// Initialize hive-mind topology
mcp__claude-flow__swarm_init { 
  topology: "hierarchical", 
  maxAgents: 10,
  strategy: "adaptive"
}

// Spawn specific hive-mind agents
mcp__claude-flow__agent_spawn { type: "queen-coordinator" }
mcp__claude-flow__agent_spawn { type: "collective-intelligence-coordinator" }
mcp__claude-flow__agent_spawn { type: "swarm-memory-manager" }
mcp__claude-flow__agent_spawn { type: "worker-specialist" }
mcp__claude-flow__agent_spawn { type: "scout-explorer" }
```

## Claude Code Task Tool Execution

After MCP coordination setup, use Claude Code's Task tool to spawn actual agents:

```javascript
Task("Queen Coordinator", "Orchestrate build process with memory writes", "queen-coordinator")
Task("Memory Manager", "Initialize distributed memory system", "swarm-memory-manager")
Task("Scout", "Explore codebase and report findings", "scout-explorer")
Task("Worker 1", "Implement API endpoints", "worker-specialist")
Task("Worker 2", "Create database schema", "worker-specialist")
```

## Memory Coordination Protocol

All hive-mind agents MUST follow the 5-step memory write pattern:

1. **STATUS** - Write agent status on startup
2. **PROGRESS** - Update progress every 30-60 seconds
3. **SHARE** - Share discoveries/decisions immediately
4. **CHECK** - Read shared memory for coordination
5. **COMPLETE** - Report task completion

```javascript
// Example memory write (MANDATORY for all agents)
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

## Examples

### Basic Hive-Mind
```bash
npx claude-flow hive-mind spawn "Build microservice"
```

### Queen-Led Development
```bash
npx claude-flow hive-mind spawn "Create API" --queen-type strategic --max-workers 5
```

### With Claude Code Integration
```bash
npx claude-flow hive-mind spawn "Research and implement" --claude
```

## See Also
- `hive-mind-init` - Initialize hive-mind configuration
- `hive-mind-status` - Check hive-mind status
- `hive-mind-memory` - Manage distributed memory
- `hive-mind-consensus` - Configure consensus algorithms
