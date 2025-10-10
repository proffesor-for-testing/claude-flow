// agent.js - Agent management commands
import { printSuccess, printError, printWarning } from '../utils.js';
import { onAgentSpawn, onAgentAction } from './performance-hooks.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function agentCommand(subArgs, flags) {
  const agentCmd = subArgs[0];

  switch (agentCmd) {
    case 'run':
    case 'execute':
      await executeAgentTask(subArgs, flags);
      break;

    case 'spawn':
      await spawnAgent(subArgs, flags);
      break;

    case 'list':
      await listAgents(subArgs, flags);
      break;

    case 'agents':
      await listAgenticFlowAgents(subArgs, flags);
      break;

    case 'hierarchy':
      await manageHierarchy(subArgs, flags);
      break;

    case 'network':
      await manageNetwork(subArgs, flags);
      break;

    case 'ecosystem':
      await manageEcosystem(subArgs, flags);
      break;

    case 'provision':
      await provisionAgent(subArgs, flags);
      break;

    case 'terminate':
      await terminateAgent(subArgs, flags);
      break;

    case 'info':
      await showAgentInfo(subArgs, flags);
      break;

    default:
      showAgentHelp();
  }
}

async function executeAgentTask(subArgs, flags) {
  const agentType = subArgs[1];
  const task = subArgs[2];

  if (!agentType || !task) {
    printError('Usage: agent run <agent-type> "<task>" [--provider <provider>] [--model <model>]');
    console.log('\nExamples:');
    console.log('  claude-flow agent run coder "Create a REST API"');
    console.log('  claude-flow agent run researcher "Research AI trends" --provider openrouter');
    console.log('  claude-flow agent run reviewer "Review code for security" --provider onnx');
    return;
  }

  printSuccess(`🚀 Executing ${agentType} agent with agentic-flow...`);
  console.log(`Task: ${task}`);

  const provider = flags.provider || 'anthropic';
  if (flags.provider) {
    console.log(`Provider: ${provider}`);
  }

  try {
    // Build command for agentic-flow
    const cmd = buildAgenticFlowCommand(agentType, task, flags);
    console.log('\n⏳ Running agent... (this may take a moment)\n');

    // Execute agentic-flow
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: flags.timeout || 300000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stdout) {
      console.log(stdout);
    }

    if (stderr && flags.verbose) {
      console.warn('\nWarnings:', stderr);
    }

    printSuccess('✅ Agent task completed successfully!');
  } catch (error) {
    printError('❌ Agent execution failed');
    console.error(error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    process.exit(1);
  }
}

function buildAgenticFlowCommand(agent, task, flags) {
  const parts = ['npx', 'agentic-flow'];

  // Agentic-flow uses --agent flag directly (no 'execute' subcommand)
  parts.push('--agent', agent);
  parts.push('--task', `"${task.replace(/"/g, '\\"')}"`);

  if (flags.provider) {
    parts.push('--provider', flags.provider);
  }

  if (flags.model) {
    parts.push('--model', flags.model);
  }

  if (flags.temperature) {
    parts.push('--temperature', flags.temperature);
  }

  if (flags.maxTokens) {
    parts.push('--max-tokens', flags.maxTokens);
  }

  if (flags.format) {
    parts.push('--output-format', flags.format);
  }

  if (flags.stream) {
    parts.push('--stream');
  }

  if (flags.verbose) {
    parts.push('--verbose');
  }

  return parts.join(' ');
}

async function listAgenticFlowAgents(subArgs, flags) {
  printSuccess('📋 Loading available agentic-flow agents...');

  try {
    // Agentic-flow uses 'agent list' command
    const { stdout } = await execAsync('npx agentic-flow agent list', {
      timeout: 30000,
    });

    console.log('\n66+ Available Agents:\n');
    console.log(stdout);
    console.log('\nUsage:');
    console.log('  claude-flow agent run <agent-type> "<task>"');
    console.log('\nExamples:');
    console.log('  claude-flow agent run coder "Build a REST API with authentication"');
    console.log('  claude-flow agent run security-auditor "Review this code for vulnerabilities"');
    console.log('  claude-flow agent run full-stack-developer "Create a Next.js app"');
  } catch (error) {
    printError('Failed to load agentic-flow agents');
    console.error('Make sure agentic-flow is installed: npm install -g agentic-flow');
    console.error(error.message);
  }
}

async function spawnAgent(subArgs, flags) {
  const agentType = subArgs[1] || 'general';
  const agentName = getFlag(subArgs, '--name') || flags.name || `agent-${Date.now()}`;
  const agentId = `${agentType}-${Date.now()}`;

  // Create the agent object
  const agent = {
    id: agentId,
    name: agentName,
    type: agentType,
    status: 'active',
    activeTasks: 0,
    lastActivity: Date.now(),
    capabilities: getAgentCapabilities(agentType),
    createdAt: Date.now()
  };

  // Store agent in session/agents directory
  const { promises: fs } = await import('fs');
  const path = await import('path');
  
  // Ensure agents directory exists
  const agentsDir = '.claude-flow/agents';
  await fs.mkdir(agentsDir, { recursive: true });
  
  // Save agent data
  const agentFile = path.join(agentsDir, `${agentId}.json`);
  await fs.writeFile(agentFile, JSON.stringify(agent, null, 2));
  
  // Update performance metrics
  const perfFile = '.claude-flow/metrics/performance.json';
  try {
    const perfData = JSON.parse(await fs.readFile(perfFile, 'utf8'));
    perfData.totalAgents = (perfData.totalAgents || 0) + 1;
    perfData.activeAgents = (perfData.activeAgents || 0) + 1;
    await fs.writeFile(perfFile, JSON.stringify(perfData, null, 2));
  } catch (e) {
    // Create new performance file if doesn't exist
    await fs.writeFile(perfFile, JSON.stringify({
      startTime: Date.now(),
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalAgents: 1,
      activeAgents: 1,
      neuralEvents: 0
    }, null, 2));
  }

  printSuccess(`✅ Spawned ${agentType} agent: ${agentName}`);
  console.log('🤖 Agent successfully created:');
  console.log(`   ID: ${agentId}`);
  console.log(`   Type: ${agentType}`);
  console.log(`   Name: ${agentName}`);
  console.log(`   Capabilities: ${agent.capabilities.join(', ')}`);
  console.log(`   Status: ${agent.status}`);
  console.log(`   Location: ${agentFile}`);
  
  // Track agent spawn for performance metrics
  await onAgentSpawn(agentId, agentType, { name: agentName });
}

function getAgentCapabilities(type) {
  const capabilities = {
    researcher: ['Research', 'Analysis', 'Information Gathering', 'Documentation'],
    coder: ['Code Generation', 'Implementation', 'Refactoring', 'Debugging'],
    tester: ['Testing', 'Validation', 'Quality Assurance', 'Performance Testing'],
    analyst: ['Data Analysis', 'Pattern Recognition', 'Reporting', 'Optimization'],
    coordinator: ['Task Management', 'Workflow Orchestration', 'Resource Allocation'],
    general: ['Research', 'Analysis', 'Code Generation']
  };
  return capabilities[type] || capabilities.general;
}

async function listAgents(subArgs, flags) {
  const { promises: fs } = await import('fs');
  const path = await import('path');
  
  const agentsDir = '.claude-flow/agents';
  const agents = [];
  
  try {
    const agentFiles = await fs.readdir(agentsDir);
    for (const file of agentFiles) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(agentsDir, file), 'utf8');
          const agent = JSON.parse(content);
          agents.push(agent);
        } catch {
          // Skip invalid agent files
        }
      }
    }
  } catch {
    // Agents directory doesn't exist yet
  }
  
  if (agents.length > 0) {
    printSuccess(`Active agents (${agents.length}):`);
    agents.forEach(agent => {
      const statusEmoji = agent.status === 'active' ? '🟢' : '🟡';
      console.log(`${statusEmoji} ${agent.name} (${agent.type})`);
      console.log(`   ID: ${agent.id}`);
      console.log(`   Status: ${agent.status}`);
      console.log(`   Tasks: ${agent.activeTasks}`);
      console.log(`   Created: ${new Date(agent.createdAt).toLocaleString()}`);
      console.log('');
    });
  } else {
    console.log('📋 No agents currently active');
    console.log('\nTo create agents:');
    console.log('  claude-flow agent spawn researcher --name "ResearchBot"');
    console.log('  claude-flow agent spawn coder --name "CodeBot"');
    console.log('  claude-flow agent spawn analyst --name "DataBot"');
  }
}

async function manageHierarchy(subArgs, flags) {
  const hierarchyCmd = subArgs[1];

  switch (hierarchyCmd) {
    case 'create':
      const hierarchyType = subArgs[2] || 'basic';
      printSuccess(`Creating ${hierarchyType} agent hierarchy`);
      console.log('🏗️  Hierarchy structure would include:');
      console.log('   - Coordinator Agent (manages workflow)');
      console.log('   - Specialist Agents (domain-specific tasks)');
      console.log('   - Worker Agents (execution tasks)');
      break;

    case 'show':
      printSuccess('Current agent hierarchy:');
      console.log('📊 No hierarchy configured (orchestrator not running)');
      break;

    default:
      console.log('Hierarchy commands: create, show');
      console.log('Examples:');
      console.log('  claude-flow agent hierarchy create enterprise');
      console.log('  claude-flow agent hierarchy show');
  }
}

async function manageNetwork(subArgs, flags) {
  const networkCmd = subArgs[1];

  switch (networkCmd) {
    case 'topology':
      printSuccess('Agent network topology:');
      console.log('🌐 Network visualization would show agent connections');
      break;

    case 'metrics':
      printSuccess('Network performance metrics:');
      console.log('📈 Communication latency, throughput, reliability stats');
      break;

    default:
      console.log('Network commands: topology, metrics');
  }
}

async function manageEcosystem(subArgs, flags) {
  const ecosystemCmd = subArgs[1];

  switch (ecosystemCmd) {
    case 'status':
      printSuccess('Agent ecosystem status:');
      console.log('🌱 Ecosystem health: Not running');
      console.log('   Active Agents: 0');
      console.log('   Resource Usage: 0%');
      console.log('   Task Queue: Empty');
      break;

    case 'optimize':
      printSuccess('Optimizing agent ecosystem...');
      console.log('⚡ Optimization would include:');
      console.log('   - Load balancing across agents');
      console.log('   - Resource allocation optimization');
      console.log('   - Communication path optimization');
      break;

    default:
      console.log('Ecosystem commands: status, optimize');
  }
}

async function provisionAgent(subArgs, flags) {
  const provision = subArgs[1];

  if (!provision) {
    printError('Usage: agent provision <count>');
    return;
  }

  const count = parseInt(provision);
  if (isNaN(count) || count < 1) {
    printError('Count must be a positive number');
    return;
  }

  printSuccess(`Provisioning ${count} agents...`);
  console.log('🚀 Auto-provisioning would create:');
  for (let i = 1; i <= count; i++) {
    console.log(`   Agent ${i}: Type=general, Status=provisioning`);
  }
}

async function terminateAgent(subArgs, flags) {
  const agentId = subArgs[1];

  if (!agentId) {
    printError('Usage: agent terminate <agent-id>');
    return;
  }

  printSuccess(`Terminating agent: ${agentId}`);
  console.log('🛑 Agent would be gracefully shut down');
}

async function showAgentInfo(subArgs, flags) {
  const agentId = subArgs[1];

  if (!agentId) {
    printError('Usage: agent info <agent-id>');
    return;
  }

  printSuccess(`Agent information: ${agentId}`);
  console.log('📊 Agent details would include:');
  console.log('   Status, capabilities, current tasks, performance metrics');
}

function getFlag(args, flagName) {
  const index = args.indexOf(flagName);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

function showAgentHelp() {
  console.log('Agent commands:');
  console.log('\n🚀 Agentic-Flow Integration (NEW in v2.6.0):');
  console.log('  run <agent> "<task>" [options]   Execute agent with multi-provider support');
  console.log('  agents                           List all 66+ agentic-flow agents');
  console.log('\n🤖 Internal Agent Management:');
  console.log('  spawn <type> [--name <name>]     Create internal agent');
  console.log('  list [--verbose]                 List active internal agents');
  console.log('  terminate <id>                   Stop specific agent');
  console.log('  info <id>                        Show agent details');
  console.log('  hierarchy <create|show>          Manage agent hierarchies');
  console.log('  network <topology|metrics>       Agent network operations');
  console.log('  ecosystem <status|optimize>      Ecosystem management');
  console.log('  provision <count>                Auto-provision agents');
  console.log();
  console.log('Execution Options (for run command):');
  console.log('  --provider <provider>            Provider: anthropic, openrouter, onnx, gemini');
  console.log('  --model <model>                  Specific model to use');
  console.log('  --temperature <temp>             Temperature (0.0-1.0)');
  console.log('  --max-tokens <tokens>            Maximum tokens');
  console.log('  --format <format>                Output format: text, json, markdown');
  console.log('  --stream                         Enable streaming');
  console.log('  --verbose                        Verbose output');
  console.log();
  console.log('Internal Agent Types:');
  console.log('  researcher    Research and information gathering');
  console.log('  coder         Code development and analysis');
  console.log('  analyst       Data analysis and insights');
  console.log('  coordinator   Task coordination and management');
  console.log('  general       Multi-purpose agent');
  console.log();
  console.log('Examples:');
  console.log('\n  # Execute with agentic-flow (multi-provider)');
  console.log('  claude-flow agent run coder "Build REST API with authentication"');
  console.log('  claude-flow agent run researcher "Research React 19 features" --provider openrouter');
  console.log('  claude-flow agent run security-auditor "Audit code" --provider onnx');
  console.log('  claude-flow agent agents  # List all available agents');
  console.log('\n  # Internal agent management');
  console.log('  claude-flow agent spawn researcher --name "DataBot"');
  console.log('  claude-flow agent list --verbose');
  console.log('  claude-flow agent hierarchy create enterprise');
}
