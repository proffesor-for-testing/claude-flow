// Temporary workaround for TypeScript compiler bug with Commander overloads
// @ts-ignore
import commanderModule from 'commander';

// Access the Command constructor directly to avoid overload issues
const CommandConstructor = commanderModule.Command || commanderModule.default?.Command || commanderModule;

// Export a fixed version that avoids the problematic overload
export const Command = CommandConstructor as any;
export default Command;