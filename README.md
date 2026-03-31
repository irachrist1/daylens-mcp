# daylens-mcp

**Your AI assistant can now answer "what was I working on?" with real precision.**

`daylens-mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server that connects Claude Code, Cursor, Windsurf, and Claude Desktop to your local [Daylens](https://github.com/irachrist1/daylens) activity database. Ask natural questions about your work history, focus, and productivity — answered from your own machine in seconds.

Zero cloud. Zero API keys. Your data never leaves your Mac.

---

## What is Daylens?

[Daylens](https://github.com/irachrist1/daylens) is a free, open-source macOS app that turns your app and browser activity into a **timeline of labeled work sessions**. Not "Chrome: 6 hours" — but *what you were actually doing, when*. AI labels every session automatically. Everything lives locally.

`daylens-mcp` gives your AI coding assistant a live window into that timeline.

---

## Demo

```
You › what was I working on this morning?

  • 06:40–09:30 (2h 50m) — Tax Filing, Email & Planning
  • 09:30–12:57 (3h 26m) — Mixed Development & Research
    Top app: Codex  |  219 context switches
  • 12:57–13:12 (15m) — X.com, YouTube, Email

You › how focused was I this week?

  Your best day: Tuesday — 71% focus score, 1h 20m longest streak.
  Wednesday: 634 context switches. Scattered.
  Total active time Monday: 12h 21m (Dia + Codex dominated).

You › find all my coding sessions from the last 3 days

  Found 8 sessions matching "development":
  • 2026-03-31 09:30 (3h 26m) — Mixed Development & Research
  • 2026-03-30 18:23 (41m) — Building & Testing
  • 2026-03-29 14:10 (2h 12m) — Cursor + GitHub work
  ...
```

---

## Install in 30 seconds

### Option A — Auto-installer (recommended)

Detects all your MCP clients and configures them automatically:

```bash
git clone https://github.com/irachrist1/daylens-mcp.git
cd daylens-mcp && bash install.sh
```

That's it. Restart your AI client and ask "what was I working on today?"

---

### Option B — Claude Code one-liner

```bash
git clone https://github.com/irachrist1/daylens-mcp.git
cd daylens-mcp && npm install && npm run build
claude mcp add daylens -- node --no-warnings $(pwd)/dist/index.js
```

---

### Option C — Manual setup per client

<details>
<summary><strong>Claude Code</strong></summary>

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

Or use the CLI:
```bash
claude mcp add daylens -- node --no-warnings /absolute/path/to/daylens-mcp/dist/index.js
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

**One-click install:**

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-badge.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=daylens&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImRheWxlbnMtbWNwIl19)

Or manually add to `~/.cursor/mcp.json`:

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

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

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

</details>

<details>
<summary><strong>Windsurf</strong></summary>

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

</details>

---

## Requirements

- **[Daylens](https://github.com/irachrist1/daylens)** installed and running on macOS
- **Node.js 22+** — check with `node --version`
- At least one MCP-compatible client: Claude Code, Cursor, Windsurf, or Claude Desktop

---

## Available tools

Once installed, your AI assistant gains access to five tools it can call automatically:

| Tool | Description |
|---|---|
| `get_timeline` | Full labeled work block timeline for any day |
| `get_focus_stats` | Focus score (0–100%), active time, longest streak, context switches |
| `get_app_usage` | Every app you used, ranked by time |
| `search_work` | Search your history by keyword, app name, or category |
| `get_recent_activity` | What you've been doing in the last N minutes |

Just ask naturally — your assistant picks the right tool automatically.

---

## How it works

Daylens stores your activity in a local SQLite database at:
```
~/Library/Application Support/Daylens/daylens.sqlite
```

`daylens-mcp` opens it **read-only** and exposes it as MCP tools. When you ask your AI a question about your work history, it calls the appropriate tool, queries the database, and answers with your real data.

No network calls. No background processes. The server starts on demand and exits when your client closes.

---

## Troubleshooting

**Server doesn't appear in my client**
Fully restart your client after installing — not just a new chat window. In Claude Code, run `claude mcp list` to confirm it's registered.

**"Database not found" error**
Daylens must be installed and have tracked at least one session. The database is created on first launch.

**Node version error**
Requires Node.js 22+. Run `node --version` to check. Install the latest LTS from [nodejs.org](https://nodejs.org).

**Permission denied on install.sh**
Run `chmod +x install.sh` first.

---

## Related

- [Daylens](https://github.com/irachrist1/daylens) — the macOS activity tracker this is built on
- [Model Context Protocol](https://modelcontextprotocol.io) — the open standard for AI tool integrations

---

## License

MIT
