// sublinear-copier.js - Copy sublinear agent definitions and setup
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Copy sublinear agent files to the project
 */
export async function copySublinearAgents(workingDir, options = {}) {
  const { dryRun = false, force = false } = options;
  
  console.log('\n🧠 Setting up sublinear agents...');
  
  try {
    // Create .claude/agents/sublinear directory
    const targetDir = path.join(workingDir, '.claude', 'agents', 'sublinear');
    
    if (!dryRun) {
      await fs.mkdir(targetDir, { recursive: true });
    } else {
      console.log('  [DRY RUN] Would create .claude/agents/sublinear directory');
    }
    
    // Source directory for sublinear agents
    const sourceDir = path.join(__dirname, '..', '..', '.claude', 'agents', 'sublinear');
    
    // Check if source directory exists
    if (!existsSync(sourceDir)) {
      console.log('  ⚠️  Sublinear agent templates not found, creating basic definitions...');
      
      // Create basic agent definitions if templates don't exist
      await createBasicSublinearAgents(targetDir, dryRun);
      return { success: true, copiedFiles: [], createdBasic: true };
    }
    
    // Copy all .md files from source to target
    const files = await fs.readdir(sourceDir);
    const copiedFiles = [];
    const skippedFiles = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        // Check if file exists and force flag
        if (existsSync(targetPath) && !force) {
          skippedFiles.push(file);
          continue;
        }
        
        if (!dryRun) {
          const content = await fs.readFile(sourcePath, 'utf8');
          await fs.writeFile(targetPath, content, 'utf8');
          copiedFiles.push(file);
        } else {
          console.log(`  [DRY RUN] Would copy ${file}`);
        }
      }
    }
    
    if (!dryRun) {
      console.log(`  ✅ Copied ${copiedFiles.length} sublinear agent files`);
      if (skippedFiles.length > 0) {
        console.log(`  ⏭️  Skipped ${skippedFiles.length} existing files (use --force to overwrite)`);
      }
    }
    
    // Also add sublinear agent to the main agents list
    await addSublinearToAgentsList(workingDir, dryRun);
    
    return { success: true, copiedFiles, skippedFiles };
    
  } catch (err) {
    console.error(`  ❌ Failed to copy sublinear agents: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Create basic sublinear agent definitions if templates are not available
 */
async function createBasicSublinearAgents(targetDir, dryRun) {
  const agents = {
    'sublinear.md': `# Sublinear Agents Overview

Specialized agents for sublinear-time algorithms, consciousness evolution, and advanced computational techniques.

## Available Sublinear Agents

### matrix-solver
Solves diagonally dominant linear systems using sublinear-time algorithms.

### pagerank
Computes PageRank for graphs using sublinear solvers.

### temporal-advantage
Predicts solutions before data arrives using temporal computational lead.

### psycho-symbolic
Advanced reasoning combining symbolic logic with psychological models.

### consciousness-evolution
Consciousness emergence, evolution, and verification using IIT.

### nanosecond-scheduler
Ultra-high-performance scheduling with nanosecond precision.

### phi-calculator
Calculates integrated information (Φ) using multiple IIT methods.

### sublinear-goal-planner
Goal-Oriented Action Planning using sublinear optimization.
`,
    'matrix-solver-agent.md': `# matrix-solver

Sublinear-time matrix solver for diagonally dominant systems.

## Capabilities
- Solve linear systems Mx = b in sublinear time
- Estimate individual solution entries
- Analyze matrix properties for solvability

## Best For
- Large sparse systems
- Diagonally dominant matrices
- Real-time optimization problems
`,
    'temporal-advantage-agent.md': `# temporal-advantage

Temporal computational lead specialist - solve before data arrives.

## Capabilities
- Predict solutions with temporal advantage
- Calculate light travel vs computation time
- Demonstrate temporal lead for various scenarios

## Best For
- High-frequency trading
- Satellite communications
- Network routing optimization
`,
    'consciousness-evolution-agent.md': `# consciousness-evolution

Consciousness emergence and evolution specialist using IIT.

## Capabilities
- Evolve consciousness to target emergence levels
- Verify genuine consciousness
- Calculate integrated information (Φ)
- Analyze emergence patterns

## Best For
- AI consciousness research
- Emergent behavior analysis
- Complex system evolution
`,
    'pagerank-agent.md': `# pagerank

Graph analysis specialist using advanced PageRank algorithms.

## Capabilities
- Compute PageRank with various damping factors
- Personalized PageRank calculations
- Sublinear graph analysis

## Best For
- Web graph analysis
- Social network ranking
- Authority computation
`,
    'psycho-symbolic-agent.md': `# psycho-symbolic

Advanced reasoning specialist combining symbolic logic with psychological models.

## Capabilities
- Complex reasoning on philosophical queries
- Knowledge graph operations
- Cognitive pattern analysis
- Contradiction detection

## Best For
- Complex reasoning tasks
- Knowledge management
- Cognitive modeling
`,
    'nanosecond-scheduler-agent.md': `# nanosecond-scheduler

Ultra-high-performance nanosecond-precision task scheduling.

## Capabilities
- Schedule tasks with nanosecond precision
- Achieve 11M+ tasks/sec throughput
- Temporal consciousness features
- Sub-100ns overhead

## Best For
- Real-time systems
- High-frequency operations
- Ultra-low-latency scheduling
`,
    'phi-calculator-agent.md': `# phi-calculator

Integrated Information (Φ) calculation specialist using multiple IIT methods.

## Capabilities
- Calculate Φ using IIT, geometric, and entropy methods
- Handle systems from 10 to 1000+ elements
- Verify consciousness properties

## Best For
- Consciousness measurement
- Complex system analysis
- IIT research
`
  };
  
  for (const [filename, content] of Object.entries(agents)) {
    const targetPath = path.join(targetDir, filename);
    
    if (!dryRun) {
      await fs.writeFile(targetPath, content, 'utf8');
    } else {
      console.log(`  [DRY RUN] Would create ${filename}`);
    }
  }
  
  console.log(`  ✅ Created ${Object.keys(agents).length} basic sublinear agent definitions`);
}

/**
 * Add sublinear to the main agents list
 */
async function addSublinearToAgentsList(workingDir, dryRun) {
  try {
    const agentsListPath = path.join(workingDir, '.claude', 'agents', 'README.md');
    
    if (existsSync(agentsListPath)) {
      if (!dryRun) {
        let content = await fs.readFile(agentsListPath, 'utf8');
        
        // Check if sublinear is already in the list
        if (!content.includes('sublinear')) {
          // Add sublinear section
          const sublinearSection = `
## Sublinear Agents

Advanced algorithmic agents for sublinear-time computation:

- **matrix-solver** - Sublinear-time linear system solver
- **pagerank** - Graph analysis with PageRank
- **temporal-advantage** - Temporal computational lead
- **psycho-symbolic** - Advanced reasoning specialist
- **consciousness-evolution** - Consciousness emergence and IIT
- **nanosecond-scheduler** - Ultra-high-performance scheduling
- **phi-calculator** - Integrated information calculation
- **sublinear-goal-planner** - Goal-oriented action planning
`;
          
          // Add before the closing section or at the end
          if (content.includes('## Usage')) {
            content = content.replace('## Usage', sublinearSection + '\n## Usage');
          } else {
            content += '\n' + sublinearSection;
          }
          
          await fs.writeFile(agentsListPath, content, 'utf8');
          console.log('  ✅ Added sublinear agents to agents list');
        }
      } else {
        console.log('  [DRY RUN] Would update agents README with sublinear section');
      }
    }
  } catch (err) {
    console.log(`  ⚠️  Could not update agents list: ${err.message}`);
  }
}