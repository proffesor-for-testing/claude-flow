// skills-copier.js - Copy all skill files during initialization
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Copy all skill files from the installed package to project directory
 */
export async function copySkillFiles(targetDir, options = {}) {
  const { force = false, dryRun = false } = options;

  // Path to skill files - try multiple locations
  const packageSkillsDir = join(__dirname, '../../../../../.claude/skills'); // From npm package
  const localSkillsDir = '/workspaces/claude-code-flow/.claude/skills';   // Local development
  const cwdSkillsDir = join(process.cwd(), '.claude/skills');              // Current working directory

  let sourceSkillsDir;

  // Try local development first, then package, then cwd
  try {
    await fs.access(localSkillsDir);
    sourceSkillsDir = localSkillsDir;
    console.log('  📁 Using local development skill files');
  } catch {
    try {
      await fs.access(packageSkillsDir);
      sourceSkillsDir = packageSkillsDir;
      console.log('  📁 Using packaged skill files');
    } catch {
      try {
        await fs.access(cwdSkillsDir);
        sourceSkillsDir = cwdSkillsDir;
        console.log('  📁 Using current directory skill files');
      } catch {
        console.log('  ⚠️  No skill files found in any location');
        return { success: false, error: 'Skill files not found' };
      }
    }
  }

  const targetSkillsDir = join(targetDir, '.claude/skills');

  console.log('📁 Copying skill system files...');
  console.log(`  📂 Source: ${sourceSkillsDir}`);
  console.log(`  📂 Target: ${targetSkillsDir}`);

  try {
    // Create target directory
    if (!dryRun) {
      await fs.mkdir(targetSkillsDir, { recursive: true });
    }

    const copiedFiles = [];
    const errors = [];

    // Recursively copy all skill files
    async function copyRecursive(srcDir, destDir) {
      const items = await fs.readdir(srcDir, { withFileTypes: true });

      for (const item of items) {
        const srcPath = join(srcDir, item.name);
        const destPath = join(destDir, item.name);

        if (item.isDirectory()) {
          if (!dryRun) {
            await fs.mkdir(destPath, { recursive: true });
          }
          await copyRecursive(srcPath, destPath);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          try {
            // Check if file already exists
            let shouldCopy = force;
            if (!force) {
              try {
                await fs.access(destPath);
                // File exists, skip unless force is true
                continue;
              } catch {
                // File doesn't exist, safe to copy
                shouldCopy = true;
              }
            }

            if (shouldCopy && !dryRun) {
              const content = await fs.readFile(srcPath, 'utf8');
              await fs.writeFile(destPath, content, 'utf8');
              copiedFiles.push(destPath.replace(targetDir + '/', ''));
            } else if (dryRun) {
              copiedFiles.push(destPath.replace(targetDir + '/', ''));
            }
          } catch (err) {
            errors.push(`Failed to copy ${item.name}: ${err.message}`);
          }
        }
      }
    }

    await copyRecursive(sourceSkillsDir, targetSkillsDir);

    if (!dryRun && copiedFiles.length > 0) {
      console.log(`  ✅ Copied ${copiedFiles.length} skill files`);
      console.log('  📋 Skill system initialized');
      console.log('  🎯 Available skills: skill-builder');
    } else if (dryRun) {
      console.log(`  [DRY RUN] Would copy ${copiedFiles.length} skill files`);
    }

    if (errors.length > 0) {
      console.log('  ⚠️  Some skill files could not be copied:');
      errors.forEach(error => console.log(`    - ${error}`));
    }

    return {
      success: true,
      copiedFiles,
      errors,
      totalSkills: copiedFiles.filter(f => f.includes('SKILL.md')).length
    };

  } catch (err) {
    console.log(`  ❌ Failed to copy skill files: ${err.message}`);
    return {
      success: false,
      error: err.message,
      copiedFiles: [],
      errors: [err.message]
    };
  }
}

/**
 * Create skill directories structure
 */
export async function createSkillDirectories(targetDir, dryRun = false) {
  const skillDirs = [
    '.claude/skills',
  ];

  if (dryRun) {
    console.log(`  [DRY RUN] Would create ${skillDirs.length} skill directories`);
    return;
  }

  for (const dir of skillDirs) {
    await fs.mkdir(join(targetDir, dir), { recursive: true });
  }

  console.log(`  ✅ Created ${skillDirs.length} skill directories`);
}

/**
 * Validate skill system after copying
 */
export async function validateSkillSystem(targetDir) {
  const skillsDir = join(targetDir, '.claude/skills');

  try {
    const items = await fs.readdir(skillsDir, { withFileTypes: true });
    const skillDirs = items.filter(item => item.isDirectory());

    let totalSkills = 0;
    const skillNames = [];

    for (const skillDir of skillDirs) {
      const skillPath = join(skillsDir, skillDir.name);
      const skillMdPath = join(skillPath, 'SKILL.md');

      try {
        await fs.access(skillMdPath);
        totalSkills++;
        skillNames.push(skillDir.name);
      } catch {
        // No SKILL.md, not a valid skill
      }
    }

    console.log('  🔍 Skill system validation:');
    console.log(`    • Total skills: ${totalSkills}`);
    console.log(`    • Skills: ${skillNames.join(', ')}`);

    return {
      valid: totalSkills > 0, // Should have at least 1 skill
      totalSkills,
      skillNames
    };

  } catch (err) {
    console.log(`  ⚠️  Skill system validation failed: ${err.message}`);
    return {
      valid: false,
      error: err.message
    };
  }
}
