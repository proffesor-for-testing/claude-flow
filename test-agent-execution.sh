#!/bin/bash
# Test script for agentic-flow integration

echo "🧪 Testing Agentic-Flow Integration..."
echo ""

# Test 1: List agents
echo "Test 1: List agents"
./bin/claude-flow agent agents | head -20
echo ""

# Test 2: Build command (dry run)
echo "Test 2: Check command format"
echo "Command would be: npx agentic-flow --agent coder --task \"Hello world\" --provider anthropic"
echo ""

echo "✅ Tests complete!"
echo ""
echo "Note: Actual execution requires valid API keys."
echo "To test execution, run:"
echo "  ./bin/claude-flow agent run coder \"Write hello world\" --provider anthropic"
