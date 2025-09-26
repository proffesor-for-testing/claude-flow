# task-orchestrate

Orchestrate complex tasks across the swarm using MCP coordination and Claude Code execution.

## Usage
```bash
npx claude-flow task orchestrate [options]
```

## Options
- `--task <description>` - Task description
- `--strategy <type>` - Orchestration strategy (parallel, sequential, adaptive)
- `--priority <level>` - Task priority (low, medium, high, critical)
- `--max-agents <n>` - Maximum agents to use

## MCP Tool Usage

```javascript
// Orchestrate task with MCP coordination
mcp__claude-flow__task_orchestrate {
  task: "Implement user authentication system",
  strategy: "parallel",
  priority: "high",
  maxAgents: 5
}

// Check task status
mcp__claude-flow__task_status {
  taskId: "task-id"
}

// Get task results
mcp__claude-flow__task_results {
  taskId: "task-id",
  format: "detailed"
}
```

## Claude Code Execution Pattern

After MCP orchestration, use Claude Code's Task tool for actual execution:

```javascript
// MCP sets up coordination
mcp__claude-flow__task_orchestrate {
  task: "Build REST API",
  strategy: "parallel"
}

// Claude Code executes with agents
Task("API Designer", "Design REST endpoints and store in memory", "api-docs")
Task("Backend Dev", "Implement endpoints with Express", "backend-dev")
Task("Database Dev", "Create schema and queries", "code-analyzer")
Task("Test Engineer", "Write API tests", "tester")
Task("Doc Writer", "Generate OpenAPI docs", "api-docs")
```

## Memory Coordination During Orchestration

All orchestrated tasks use memory for coordination:

```javascript
// Task status tracking
mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/task/[task-id]/status",
  namespace: "coordination",
  value: JSON.stringify({
    task_id: "task-123",
    status: "in_progress",
    agents_assigned: ["coder-1", "tester-1"],
    progress: 45
  })
}

// Share task dependencies
mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/shared/task-dependencies",
  namespace: "coordination",
  value: JSON.stringify({
    task_a: ["task_b", "task_c"],
    task_b: [],
    task_c: ["task_b"]
  })
}
```

## Orchestration Strategies

### Parallel
- Execute independent tasks simultaneously
- Maximum speed and efficiency
- Best for: Non-dependent tasks

### Sequential
- Execute tasks in order
- Clear dependencies and flow
- Best for: Pipeline processing

### Adaptive
- Dynamic strategy based on task analysis
- Adjusts based on performance metrics
- Best for: Complex, unknown tasks

## Examples

### Basic Task Orchestration
```bash
npx claude-flow task orchestrate --task "Implement user authentication"
```

### High Priority Bug Fix
```bash
npx claude-flow task orchestrate --task "Fix production memory leak" --priority critical --strategy parallel
```

### Complex Feature Development
```bash
npx claude-flow task orchestrate --task "Build e-commerce checkout" --strategy adaptive --max-agents 8
```

### With Claude Code Integration
```javascript
// Full orchestration example
[Single Message]:
  // Setup coordination
  mcp__claude-flow__swarm_init { topology: "hierarchical" }
  mcp__claude-flow__task_orchestrate { 
    task: "Build payment system",
    strategy: "parallel",
    priority: "high"
  }
  
  // Execute with agents
  Task("Architect", "Design payment flow", "system-architect")
  Task("Backend", "Implement payment API", "backend-dev")
  Task("Frontend", "Build payment UI", "coder")
  Task("Security", "Review payment security", "reviewer")
  Task("Tester", "Test payment flow", "tester")
```

## See Also
- `swarm-init` - Initialize swarm for orchestration
- `agent-spawn` - Spawn agents for tasks
- `task-status` - Check orchestration status
- `memory-usage` - Coordinate through memory
