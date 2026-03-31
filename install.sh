#!/bin/bash
set -e

# daylens-mcp installer
# Automatically detects and configures all MCP clients on your machine

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo ""
echo -e "${BOLD}daylens-mcp installer${RESET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Prerequisites ──────────────────────────────────────────────────────────────

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 22 ]; then
  echo -e "${RED}✗ Node.js 22+ required. Current: $(node --version 2>/dev/null || echo 'not found')${RESET}"
  echo "  Install from https://nodejs.org"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${RESET}"

# Check Daylens database
DB_PATH="$HOME/Library/Application Support/Daylens/daylens.sqlite"
if [ ! -f "$DB_PATH" ]; then
  echo -e "${RED}✗ Daylens database not found at:${RESET}"
  echo "  $DB_PATH"
  echo ""
  echo "  Install Daylens: https://github.com/irachrist1/daylens"
  exit 1
fi
echo -e "${GREEN}✓ Daylens database found${RESET}"

# ── Build ──────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$SCRIPT_DIR/dist/index.js"

if [ ! -f "$DIST" ]; then
  echo ""
  echo "Building daylens-mcp..."
  cd "$SCRIPT_DIR"
  npm install --silent
  npm run build --silent
fi
echo -e "${GREEN}✓ Server built at $DIST${RESET}"

# ── Helper: add to JSON config ─────────────────────────────────────────────────

add_to_config() {
  local config_file="$1"
  local client_name="$2"
  local dir
  dir=$(dirname "$config_file")

  # Create directory and file if needed
  mkdir -p "$dir"

  if [ ! -f "$config_file" ]; then
    echo '{"mcpServers":{}}' > "$config_file"
  fi

  # Check if daylens already configured
  if python3 -c "import json,sys; d=json.load(open('$config_file')); sys.exit(0 if 'daylens' in d.get('mcpServers',{}) else 1)" 2>/dev/null; then
    echo -e "${YELLOW}⟳ $client_name — already configured, skipping${RESET}"
    return
  fi

  # Inject the daylens server entry
  python3 - "$config_file" "$DIST" <<'EOF'
import json, sys
path = sys.argv[1]
dist = sys.argv[2]
with open(path) as f:
    config = json.load(f)
if "mcpServers" not in config:
    config["mcpServers"] = {}
config["mcpServers"]["daylens"] = {
    "command": "node",
    "args": ["--no-warnings", dist]
}
with open(path, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\n")
EOF

  echo -e "${GREEN}✓ $client_name configured${RESET}"
  echo "  $config_file"
}

# ── Detect and configure clients ───────────────────────────────────────────────

echo ""
echo "Detecting MCP clients..."
echo ""

CONFIGURED=0

# Claude Code
CLAUDE_MCP="$HOME/.claude/mcp.json"
if command -v claude &>/dev/null || [ -d "$HOME/.claude" ]; then
  add_to_config "$CLAUDE_MCP" "Claude Code"
  CONFIGURED=$((CONFIGURED + 1))
fi

# Claude Desktop
CLAUDE_DESKTOP="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -d "$HOME/Library/Application Support/Claude" ]; then
  add_to_config "$CLAUDE_DESKTOP" "Claude Desktop"
  CONFIGURED=$((CONFIGURED + 1))
fi

# Cursor
CURSOR_MCP="$HOME/.cursor/mcp.json"
if [ -d "$HOME/.cursor" ]; then
  add_to_config "$CURSOR_MCP" "Cursor"
  CONFIGURED=$((CONFIGURED + 1))
fi

# Windsurf
WINDSURF_MCP="$HOME/.codeium/windsurf/mcp_config.json"
if [ -d "$HOME/.codeium/windsurf" ]; then
  add_to_config "$WINDSURF_MCP" "Windsurf"
  CONFIGURED=$((CONFIGURED + 1))
fi

# ── Result ─────────────────────────────────────────────────────────────────────

echo ""
if [ "$CONFIGURED" -eq 0 ]; then
  echo -e "${YELLOW}No MCP clients detected.${RESET}"
  echo ""
  echo "Manually add to your client's MCP config:"
  echo ""
  echo '  "daylens": {'
  echo '    "command": "node",'
  echo "    \"args\": [\"--no-warnings\", \"$DIST\"]"
  echo '  }'
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}${BOLD}Done! Configured $CONFIGURED client(s).${RESET}"
  echo ""
  echo "Restart your AI client, then ask:"
  echo "  \"What was I working on this morning?\""
  echo ""
fi
