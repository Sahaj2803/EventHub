#!/bin/bash

# Event Web MCP Tool Setup Script

echo "🚀 Setting up Event Web MCP Tool with TestSprite Integration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.0.0 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18.0.0 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install @modelcontextprotocol/sdk axios

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating environment file..."
    cp mcp-tool-env.example .env
    echo "✅ Environment file created. Please update with your API keys."
else
    echo "✅ Environment file already exists"
fi

# Make the MCP tool executable
chmod +x mcp-tool.js

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your TestSprite API key"
echo "2. Set EVENT_WEB_AUTH_TOKEN after logging in"
echo "3. Add the tool to your MCP configuration"
echo ""
echo "🔧 MCP Configuration:"
echo "Add this to your MCP config file (~/.cursor/mcp.json):"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "event-web-tool": {'
echo '      "command": "node",'
echo '      "args": ["'$(pwd)'/mcp-tool.js"],'
echo '      "env": {'
echo '        "TESTSPRITE_API_KEY": "your-testsprite-api-key-here",'
echo '        "EVENT_WEB_API_BASE": "http://localhost:5005/api"'
echo '      }'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "📖 For detailed usage instructions, see MCP_TOOL_README.md"
