import { printSuccess, printError, printWarning } from '../utils.js';
import { promises as fs } from 'fs';
import { KeyRedactor } from '../../utils/key-redactor.js';
export async function memoryCommand(subArgs, flags) {
    const memorySubcommand = subArgs[0];
    const memoryStore = './memory/memory-store.json';
    const namespace = flags?.namespace || flags?.ns || getNamespaceFromArgs(subArgs) || 'default';
    const enableRedaction = flags?.redact || subArgs.includes('--redact') || subArgs.includes('--secure');
    async function loadMemory() {
        try {
            const content = await fs.readFile(memoryStore, 'utf8');
            return JSON.parse(content);
        } catch  {
            return {};
        }
    }
    async function saveMemory(data) {
        await fs.mkdir('./memory', {
            recursive: true
        });
        await fs.writeFile(memoryStore, JSON.stringify(data, null, 2, 'utf8'));
    }
    switch(memorySubcommand){
        case 'store':
            await storeMemory(subArgs, loadMemory, saveMemory, namespace, enableRedaction);
            break;
        case 'query':
            await queryMemory(subArgs, loadMemory, namespace, enableRedaction);
            break;
        case 'stats':
            await showMemoryStats(loadMemory);
            break;
        case 'export':
            await exportMemory(subArgs, loadMemory, namespace);
            break;
        case 'import':
            await importMemory(subArgs, saveMemory, loadMemory);
            break;
        case 'clear':
            await clearMemory(subArgs, saveMemory, namespace);
            break;
        case 'list':
            await listNamespaces(loadMemory);
            break;
        default:
            showMemoryHelp();
    }
}
async function storeMemory(subArgs, loadMemory, saveMemory, namespace, enableRedaction = false) {
    const key = subArgs[1];
    let value = subArgs.slice(2).join(' ');
    if (!key || !value) {
        printError('Usage: memory store <key> <value> [--namespace <ns>] [--redact]');
        return;
    }
    try {
        let redactedValue = value;
        let securityWarnings = [];
        if (enableRedaction) {
            redactedValue = KeyRedactor.redact(value, true);
            const validation = KeyRedactor.validate(value);
            if (!validation.safe) {
                securityWarnings = validation.warnings;
                printWarning('🔒 Redaction enabled: Sensitive data detected and redacted');
                securityWarnings.forEach((warning)=>console.log(`   ⚠️  ${warning}`));
            }
        } else {
            const validation = KeyRedactor.validate(value);
            if (!validation.safe) {
                printWarning('⚠️  Potential sensitive data detected! Use --redact flag for automatic redaction');
                validation.warnings.forEach((warning)=>console.log(`   ⚠️  ${warning}`));
                console.log('   💡 Tip: Add --redact flag to automatically redact API keys');
            }
        }
        const data = await loadMemory();
        if (!data[namespace]) {
            data[namespace] = [];
        }
        data[namespace] = data[namespace].filter((e)=>e.key !== key);
        data[namespace].push({
            key,
            value: redactedValue,
            namespace,
            timestamp: Date.now(),
            redacted: enableRedaction && securityWarnings.length > 0
        });
        await saveMemory(data);
        printSuccess(enableRedaction && securityWarnings.length > 0 ? '🔒 Stored successfully (with redaction)' : '✅ Stored successfully');
        console.log(`📝 Key: ${key}`);
        console.log(`📦 Namespace: ${namespace}`);
        console.log(`💾 Size: ${new TextEncoder().encode(redactedValue).length} bytes`);
        if (enableRedaction && securityWarnings.length > 0) {
            console.log(`🔒 Security: ${securityWarnings.length} sensitive pattern(s) redacted`);
        }
    } catch (err) {
        printError(`Failed to store: ${err.message}`);
    }
}
async function queryMemory(subArgs, loadMemory, namespace, enableRedaction = false) {
    const search = subArgs.slice(1).join(' ');
    if (!search) {
        printError('Usage: memory query <search> [--namespace <ns>] [--redact]');
        return;
    }
    try {
        const data = await loadMemory();
        const results = [];
        for (const [ns, entries] of Object.entries(data)){
            if (namespace && ns !== namespace) continue;
            for (const entry of entries){
                if (entry.key.includes(search) || entry.value.includes(search)) {
                    results.push(entry);
                }
            }
        }
        if (results.length === 0) {
            printWarning('No results found');
            return;
        }
        printSuccess(`Found ${results.length} results:`);
        results.sort((a, b)=>b.timestamp - a.timestamp);
        for (const entry of results.slice(0, 10)){
            console.log(`\n📌 ${entry.key}`);
            console.log(`   Namespace: ${entry.namespace}`);
            let displayValue = entry.value;
            if (enableRedaction) {
                displayValue = KeyRedactor.redact(displayValue, true);
            }
            console.log(`   Value: ${displayValue.substring(0, 100)}${displayValue.length > 100 ? '...' : ''}`);
            console.log(`   Stored: ${new Date(entry.timestamp).toLocaleString()}`);
            if (entry.redacted) {
                console.log(`   🔒 Status: Redacted on storage`);
            } else if (enableRedaction) {
                console.log(`   🔒 Status: Redacted for display`);
            }
        }
        if (results.length > 10) {
            console.log(`\n... and ${results.length - 10} more results`);
        }
    } catch (err) {
        printError(`Failed to query: ${err.message}`);
    }
}
async function showMemoryStats(loadMemory) {
    try {
        const data = await loadMemory();
        let totalEntries = 0;
        const namespaceStats = {};
        for (const [namespace, entries] of Object.entries(data)){
            namespaceStats[namespace] = entries.length;
            totalEntries += entries.length;
        }
        printSuccess('Memory Bank Statistics:');
        console.log(`   Total Entries: ${totalEntries}`);
        console.log(`   Namespaces: ${Object.keys(data).length}`);
        console.log(`   Size: ${(new TextEncoder().encode(JSON.stringify(data)).length / 1024).toFixed(2)} KB`);
        if (Object.keys(data).length > 0) {
            console.log('\n📁 Namespace Breakdown:');
            for (const [namespace, count] of Object.entries(namespaceStats)){
                console.log(`   ${namespace}: ${count} entries`);
            }
        }
    } catch (err) {
        printError(`Failed to get stats: ${err.message}`);
    }
}
async function exportMemory(subArgs, loadMemory, namespace) {
    const filename = subArgs[1] || `memory-export-${Date.now()}.json`;
    try {
        const data = await loadMemory();
        let exportData = data;
        if (namespace) {
            exportData = {
                [namespace]: data[namespace] || []
            };
        }
        await fs.writeFile(filename, JSON.stringify(exportData, null, 2, 'utf8'));
        printSuccess(`Memory exported to ${filename}`);
        let totalEntries = 0;
        for (const entries of Object.values(exportData)){
            totalEntries += entries.length;
        }
        console.log(`📦 Exported ${totalEntries} entries from ${Object.keys(exportData).length} namespace(s)`);
    } catch (err) {
        printError(`Failed to export memory: ${err.message}`);
    }
}
async function importMemory(subArgs, saveMemory, loadMemory) {
    const filename = subArgs[1];
    if (!filename) {
        printError('Usage: memory import <filename>');
        return;
    }
    try {
        const importContent = await fs.readFile(filename, 'utf8');
        const importData = JSON.parse(importContent);
        const existingData = await loadMemory();
        let totalImported = 0;
        for (const [namespace, entries] of Object.entries(importData)){
            if (!existingData[namespace]) {
                existingData[namespace] = [];
            }
            const existingKeys = new Set(existingData[namespace].map((e)=>e.key));
            const newEntries = entries.filter((e)=>!existingKeys.has(e.key));
            existingData[namespace].push(...newEntries);
            totalImported += newEntries.length;
        }
        await saveMemory(existingData);
        printSuccess(`Imported ${totalImported} new entries from ${filename}`);
    } catch (err) {
        printError(`Failed to import memory: ${err.message}`);
    }
}
async function clearMemory(subArgs, saveMemory, namespace) {
    if (!namespace || namespace === 'default') {
        const nsFromArgs = getNamespaceFromArgs(subArgs);
        if (!nsFromArgs) {
            printError('Usage: memory clear --namespace <namespace>');
            printWarning('This will clear all entries in the specified namespace');
            return;
        }
        namespace = nsFromArgs;
    }
    try {
        async function loadMemory() {
            try {
                const content = await fs.readFile('./memory/memory-store.json', 'utf8');
                return JSON.parse(content);
            } catch  {
                return {};
            }
        }
        const data = await loadMemory();
        if (!data[namespace]) {
            printWarning(`Namespace '${namespace}' does not exist`);
            return;
        }
        const entryCount = data[namespace].length;
        delete data[namespace];
        await saveMemory(data);
        printSuccess(`Cleared ${entryCount} entries from namespace '${namespace}'`);
    } catch (err) {
        printError(`Failed to clear memory: ${err.message}`);
    }
}
async function listNamespaces(loadMemory) {
    try {
        const data = await loadMemory();
        const namespaces = Object.keys(data);
        if (namespaces.length === 0) {
            printWarning('No namespaces found');
            return;
        }
        printSuccess('Available namespaces:');
        for (const namespace of namespaces){
            const count = data[namespace].length;
            console.log(`  ${namespace} (${count} entries)`);
        }
    } catch (err) {
        printError(`Failed to list namespaces: ${err.message}`);
    }
}
function getNamespaceFromArgs(subArgs) {
    const namespaceIndex = subArgs.indexOf('--namespace');
    if (namespaceIndex !== -1 && namespaceIndex + 1 < subArgs.length) {
        return subArgs[namespaceIndex + 1];
    }
    const nsIndex = subArgs.indexOf('--ns');
    if (nsIndex !== -1 && nsIndex + 1 < subArgs.length) {
        return subArgs[nsIndex + 1];
    }
    return null;
}
async function loadMemory() {
    try {
        const content = await fs.readFile('./memory/memory-store.json', 'utf8');
        return JSON.parse(content);
    } catch  {
        return {};
    }
}
function showMemoryHelp() {
    console.log('Memory commands:');
    console.log('  store <key> <value>    Store a key-value pair');
    console.log('  query <search>         Search for entries');
    console.log('  stats                  Show memory statistics');
    console.log('  export [filename]      Export memory to file');
    console.log('  import <filename>      Import memory from file');
    console.log('  clear --namespace <ns> Clear a namespace');
    console.log('  list                   List all namespaces');
    console.log();
    console.log('Options:');
    console.log('  --namespace <ns>       Specify namespace for operations');
    console.log('  --ns <ns>              Short form of --namespace');
    console.log('  --redact               🔒 Enable API key redaction (security feature)');
    console.log('  --secure               Alias for --redact');
    console.log();
    console.log('🔒 Security Features (NEW in v2.6.0):');
    console.log('  API Key Protection:    Automatically detects and redacts sensitive data');
    console.log('  Patterns Detected:     Anthropic, OpenRouter, Gemini, Bearer tokens, etc.');
    console.log('  Auto-Validation:       Warns when storing unredacted sensitive data');
    console.log('  Display Redaction:     Redact sensitive data when querying with --redact');
    console.log();
    console.log('Examples:');
    console.log('  memory store previous_work "Research findings from yesterday"');
    console.log('  memory store api_config "key=sk-ant-..." --redact  # 🔒 Redacts API key');
    console.log('  memory query research --namespace sparc');
    console.log('  memory query config --redact  # 🔒 Shows redacted values');
    console.log('  memory export backup.json --namespace default');
    console.log('  memory import project-memory.json');
    console.log('  memory stats');
    console.log();
    console.log('💡 Tip: Always use --redact when storing API keys or secrets!');
}

//# sourceMappingURL=memory.js.map