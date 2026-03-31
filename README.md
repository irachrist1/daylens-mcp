# daylens-mcp

**Ask your AI assistant what you were working on. Get a real answer.**

`daylens-mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server that connects AI coding tools — Claude Code, Cursor, Windsurf, Claude Desktop — to your local [Daylens](https://github.com/irachrist1/daylens) activity database. Ask natural questions about your work history and get precise answers pulled directly from your machine.

Built by reverse-engineering the Claude Code tool system. Zero cloud. Zero API keys. Your data never leaves your Mac.

---

## What is Daylens?

[Daylens](https://github.com/irachrist1/daylens) is a free, open-source macOS app that watches your apps and browser activity and turns your day into a **timeline of labeled work sessions** — not just "Chrome: 6 hours" but *what you were actually doing*. Every session gets an AI-generated label. Everything stays on your device.

`daylens-mcp` gives your AI assistant a live read of that timeline.

---

## What it looks like

```
You: what was I working on this morning?

Claude: Here's your Daylens timeline for today:

  • 06:40–09:30 (2h 50m) — Tax Filing, Email & Planning
  • 09:30–12:57 (3h 26m) — Mixed Development & Research
    Codex + Cursor, 219 context switches
  • 12:57–13:12 (15m) — X.com, YouTube, Email

You: how focused was I this week?

Claude: Your best day was Tuesday — 71% focus score, longest streak 1h 20m.
  Wednesday was rough: 634 context switches, 51% focus. Scattered.
  You spent 12h 21m active on Monday, mostly in Dia and Codex.

You: find all my coding sessions from the last 3 days

Claude: Found 8 sessions matching "development" in the last 3 days:
  • 2026-03-31 09:30 (3h 26m) — Mixed Development & Research
  • 2026-03-30 18:23 (41m) — Building & Testing
  • 2026-03-29 14:10 (2h 12m) — Cursor + GitHub work
  ...
```

---

## Tools

| Tool | What it does |
|---|---|
| `get_timeline` | Full labeled work block timeline for any day |
| `get_focus_stats` | Focus score, active time, longest streak, context switches |
| `get_app_usage` | Every app you used and how long, ranked by time |
| `search_work` | Search your history by keyword, app, or category |
| `get_recent_activity` | What you've been doing in the last N minutes |

---

## Requirements

- [Daylens](https://github.com/irachrist1/daylens) installed and running on macOS
- Node.js 22 or later
- An MCP-compatible client: Claude Code, Cursor, Windsurf, or Claude Desktop

---

## Installation

### Option 1 — Clone and build (recommended)

```bash
git clone https://github.com/irachrist1/daylens-mcp.git
cd daylens-mcp
npm install
npm run build
```

Then follow the setup for your client below.

### Option 2 — npx (no install)

Replace the `command`/`args` in any config below with:
```json
"command": "npx",
"args": ["-y", "daylens-mcp"]
```

---

## Client Setup

### Claude Code

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "daylens": {
      "type": "stdio",
      "command": "node",
      "args": ["--no-warnings", "/absolute/path/to/daylens-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Code. On first use, approve the server when prompted.

### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "daylens": {
      "command": "node",
      "args": ["--no-warnings", "/absolute/path/to/daylens-mcp/dist/index.js"]
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "daylens": {
      "command": "node",
      "args": ["--no-warnings", "/absolute/path/to/daylens-mcp/dist/index.js"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "daylens": {
      "command": "node",
      "args": ["--no-warnings", "/absolute/path/to/daylens-mcp/dist/index.js"]
    }
  }
}
```

---

## How it works

Daylens stores your activity data in a local SQLite database at:
```
~/Library/Application Support/Daylens/daylens.sqlite
```

`daylens-mcp` opens it **read-only** and exposes five MCP tools that query your work blocks, focus scores, app sessions, and website visits. Your AI assistant calls these tools automatically when you ask questions about your work history.

The server uses Node's built-in `node:sqlite` module — no native addons, no compilation, no external database drivers.

---

## Troubleshooting

**Server doesn't appear in my client**
Restart your client completely after editing the config. Some clients also require you to approve new MCP servers on first launch.

**"Database not found" error**
Make sure Daylens is installed and has tracked at least one day of activity. The database is created automatically on first run.

**Node version error**
`node:sqlite` requires Node.js 22 or later. Check your version with `node --version`.

**Path issues**
Use the full absolute path to `dist/index.js` — no `~` shorthand. Run `pwd` in the `daylens-mcp` directory to get it.

---

## Related

- [Daylens](https://github.com/irachrist1/daylens) — the macOS activity tracker this is built for
- [Model Context Protocol](https://modelcontextprotocol.io) — the open standard powering this integration

---

## License

MIT
