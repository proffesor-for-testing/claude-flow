// test-wasm-import.mjs
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testing WASM import in claude-flow...\n');

try {
    // Test 1: Check if agentic-flow is installed
    console.log('1. Checking agentic-flow installation...');
    const pkg = await import('agentic-flow/package.json', { assert: { type: 'json' } });
    console.log(`   ✅ agentic-flow@${pkg.default.version} installed\n`);

    // Test 2: Check if WASM files exist
    console.log('2. Checking WASM files...');
    const fs = await import('fs');
    const wasmPath = join(__dirname, 'node_modules/agentic-flow/wasm/reasoningbank/reasoningbank_wasm_bg.wasm');
    const exists = fs.existsSync(wasmPath);
    console.log(`   ${exists ? '✅' : '❌'} WASM binary: ${wasmPath}`);
    if (exists) {
        const stats = fs.statSync(wasmPath);
        console.log(`   📦 Size: ${(stats.size / 1024).toFixed(1)}KB\n`);
    }

    // Test 3: Try direct import
    console.log('3. Testing direct import...');
    const { createReasoningBank } = await import('agentic-flow/dist/reasoningbank/wasm-adapter.js');
    console.log(`   ✅ createReasoningBank function imported\n`);

    // Test 4: Try creating instance
    console.log('4. Testing ReasoningBank creation...');
    const rb = await createReasoningBank('test-db');
    console.log('   ✅ ReasoningBank instance created\n');

    // Test 5: Test basic operation
    console.log('5. Testing pattern storage...');
    const start = Date.now();
    const id = await rb.storePattern({
        task_description: 'Test pattern from claude-flow',
        task_category: 'test',
        strategy: 'validation',
        success_score: 0.9
    });
    const duration = Date.now() - start;
    console.log(`   ✅ Pattern stored in ${duration}ms`);
    console.log(`   📝 Pattern ID: ${id}\n`);

    console.log('🎉 ALL TESTS PASSED - WASM is working!\n');
    console.log('✅ The issue is in how claude-flow imports/uses the adapter');

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n📋 Error details:');
    console.error('   Type:', error.constructor.name);
    console.error('   Code:', error.code);
    console.error('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));

    console.log('\n🔍 Diagnosis:');
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
        console.log('   → agentic-flow not installed or wrong path');
        console.log('   → Run: npm install agentic-flow@1.5.11');
    } else if (error.message.includes('WASM')) {
        console.log('   → WASM loading issue in Node.js');
        console.log('   → Check Node.js version (needs v16+)');
    } else {
        console.log('   → Import/module resolution issue in claude-flow');
        console.log('   → Check package.json "type" field');
    }
}
