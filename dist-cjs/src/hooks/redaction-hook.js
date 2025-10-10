import { KeyRedactor } from '../utils/key-redactor.js';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
export async function validateNoSensitiveData() {
    const issues = [];
    try {
        const stagedFiles = execSync('git diff --cached --name-only', {
            encoding: 'utf-8'
        }).split('\n').filter((f)=>f.trim() && !f.includes('.env') && !f.includes('node_modules'));
        for (const file of stagedFiles){
            try {
                const content = readFileSync(file, 'utf-8');
                const validation = KeyRedactor.validate(content);
                if (!validation.safe) {
                    issues.push(`⚠️  ${file}: ${validation.warnings.join(', ')}`);
                }
            } catch (error) {
                continue;
            }
        }
        return {
            safe: issues.length === 0,
            issues
        };
    } catch (error) {
        console.error('Error validating sensitive data:', error);
        return {
            safe: false,
            issues: [
                'Failed to validate files'
            ]
        };
    }
}
export async function runRedactionCheck() {
    console.log('🔒 Running API key redaction check...\n');
    const result = await validateNoSensitiveData();
    if (!result.safe) {
        console.error('❌ COMMIT BLOCKED - Sensitive data detected:\n');
        result.issues.forEach((issue)=>console.error(issue));
        console.error('\n⚠️  Please remove sensitive data before committing.');
        console.error('💡 Tip: Use environment variables instead of hardcoding keys.\n');
        return 1;
    }
    console.log('✅ No sensitive data detected - safe to commit\n');
    return 0;
}
if (require.main === module) {
    runRedactionCheck().then((code)=>process.exit(code)).catch((error)=>{
        console.error('Error:', error);
        process.exit(1);
    });
}

//# sourceMappingURL=redaction-hook.js.map