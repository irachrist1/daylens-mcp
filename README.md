# daylens-mcp

> Ask Claude what you were doing at 2pm last Thursday. Get a real answer.

An MCP server that connects [Claude Code](https://claude.ai/code) to your local [Daylens](https://github.com/irachrist1/daylens) activity database — so you can query your entire work history in plain language, straight from your terminal.

Built using the Claude Code source to understand exactly how MCP servers plug into the tool system. Zero cloud. Zero tracking. Your data never leaves your machine.

---

## What it looks like

```
you: what was I working on this morning?

Claude: Based on your Daylens timeline today:
  • 06:40–09:30 (2h 50m) — Tax Filing, Email & Planning
  • 09:30–12:57 (3h 26m) — Mixed Development & Research (Codex, Cursor)
  • 12:57–13:12 (15m) — X.com, YouTube, Email

you: how focused was I this week?

Claude: Tuesday was your best day — 71% focus score, 1h 20m longest streak.
  Wednesday you hit 634 context switches. Scattered.
```

---

## Tools

| Tool | Description |
|---|---|
| `get_timeline` | Work blocks for any day with labels, durations, and context |
| `get_focus_stats` | Focus score, active time, longest streak |
| `get_app_usage` | Every app you used and for how long |
| `search_work` | Search your history by keyword across any date range |
| `get_recent_activity` | What you've been doing in the last N minutes |

---

## Requirements

- [Daylens](https://github.com/irachrist1/daylens) installed and running (macOS)
- [Claude Code](https://claude.ai/code) CLI
- Node.js 22+

---

## Setup

```bash
git clone https://github.com/irachrist1/daylens-mcp
cd daylens-mcp
npm install
npm run build
```

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "daylens": {
      "type": "stdio",
      "command": "node",
      "args": ["--experimental-sqlite", "/absolute/path/to/daylens-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Code. Done.

---

## How it works

Daylens stores your activity timeline in a local SQLite database at `~/Library/Application Support/Daylens/daylens.sqlite`. This MCP server opens it read-only and exposes your work blocks, focus scores, app sessions, and website visits as tools Claude can call.

No API keys. No sync. No server. Just your data.

---

## License

MIT
