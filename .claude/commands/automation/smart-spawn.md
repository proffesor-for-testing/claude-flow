# smart-spawn

Intelligently spawn agents based on workload analysis using MCP coordination and Claude Code execution.

## Usage
```bash
npx claude-flow automation smart-spawn [options]
```

## Options
- `--analyze` - Analyze workload before spawning
- `--threshold <n>` - Spawn threshold for agent count
- `--topology <type>` - Preferred topology (mesh, hierarchical, ring, star)
- `--memory` - Enable memory coordination

## MCP Tool Integration

```javascript
// Analyze workload and spawn agents
mcp__claude-flow__swarm_init {
  topology: "hierarchical",
  strategy: "adaptive"
}

// Smart agent spawning based on task complexity
mcp__claude-flow__agent_spawn { 
  type: "researcher",
  capabilities: ["code-analysis", "pattern-detection"]
}

// Check memory for prior decisions
mcp__claude-flow__memory_usage {
  action: "retrieve",
  key: "swarm/shared/agent-allocation",
  namespace: "coordination"
}
```

## Claude Code Execution

After smart analysis, spawn agents with Task tool:

```javascript
// Smart spawn based on workload analysis
[Single Message]:
  // Analyze task complexity
  Task("Analyzer", "Analyze project complexity and requirements", "code-analyzer")
  
  // Based on analysis, spawn appropriate agents
  Task("Architect", "Design system architecture", "system-architect")
  Task("Backend Dev", "Implement server logic", "backend-dev")
  Task("Frontend Dev", "Build user interface", "coder")
  Task("Tester", "Create comprehensive tests", "tester")
  
  // Store spawning decisions
  mcp__claude-flow__memory_usage {
    action: "store",
    key: "swarm/shared/spawn-decisions",
    namespace: "coordination",
    value: JSON.stringify({
      agents_spawned: 5,
      topology: "hierarchical",
      reason: "complex full-stack project"
    })
  }
```

## Smart Spawning Logic

### Analysis Phase
1. Analyze codebase size and complexity
2. Check existing agent workload
3. Review memory for past patterns
4. Determine optimal agent count

### Decision Factors
- **Code Complexity**: More complex = more specialized agents
- **File Count**: Large projects need more workers
- **Task Type**: Different tasks need different specialists
- **Performance Metrics**: Spawn more if bottlenecks detected

### Agent Selection
```javascript
// Smart selection based on task
if (task.includes("API")) {
  spawn("backend-dev", "api-docs", "tester")
}
if (task.includes("UI")) {
  spawn("coder", "mobile-dev", "tester")
}
if (task.includes("database")) {
  spawn("code-analyzer", "migration-planner")
}
```

## Memory Coordination

Smart spawn uses memory to learn and improve:

```javascript
// Store spawn patterns for learning
mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/smart-spawn/patterns",
  namespace: "coordination",
  value: JSON.stringify({
    task_type: "full-stack",
    agents_used: ["backend-dev", "coder", "tester"],
    success_rate: 0.92,
    completion_time: 3600000
  })
}

// Retrieve past patterns for decision
mcp__claude-flow__memory_usage {
  action: "retrieve",
  key: "swarm/smart-spawn/patterns",
  namespace: "coordination"
}
```

## Examples

### Basic Smart Spawn
```bash
npx claude-flow automation smart-spawn --analyze
```

### With Spawn Threshold
```bash
npx claude-flow automation smart-spawn --threshold 8 --analyze
```

### Force Hierarchical Topology
```bash
npx claude-flow automation smart-spawn --topology hierarchical --memory
```

### Full Automation Example
```javascript
// Complete smart spawn workflow
[Single Message]:
  // Initialize with smart defaults
  mcp__claude-flow__swarm_init { 
    topology: "adaptive",
    strategy: "balanced"
  }
  
  // Analyze and spawn
  Task("Analyzer", "Analyze project and determine agent needs", "code-analyzer")
  
  // Based on analysis, spawn optimal agents
  Task("Queen", "Coordinate smart spawn decisions", "queen-coordinator")
  Task("Memory Manager", "Track spawn patterns", "swarm-memory-manager")
  Task("Workers", "Execute based on analysis", "worker-specialist")
```

## See Also
- `auto-agent` - Automatic agent management
- `swarm-init` - Initialize swarm topology
- `agent-spawn` - Manual agent spawning
- `memory-usage` - Coordination memory
