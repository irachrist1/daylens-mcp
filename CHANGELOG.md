# Changelog

## [1.0.0] - 2026-04-01

### Added
- Initial release of daylens-mcp — an MCP server that connects Claude Code, Cursor, Windsurf, and Claude Desktop to your local Daylens activity database
- `get_timeline` tool: labeled work block timeline for any day with durations, context switches, and AI-generated session labels
- `get_focus_stats` tool: focus score, active time, longest deep work streak, and context switch count for any day
- `get_app_usage` tool: every app used ranked by time, with session counts and categories
- `search_work` tool: full-text search across work history by label, app name, category, or session description
- `get_recent_activity` tool: live view of what you've been doing in the last N minutes
- Auto-installer script that detects and configures all MCP clients on your machine in one command
- Published to npm — install with `npx -y daylens-mcp`, no cloning required
- One-click Cursor install badge
- Zero cloud, zero API keys — reads your local Daylens SQLite database read-only
