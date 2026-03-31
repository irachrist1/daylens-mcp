#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DatabaseSync } from "node:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";

const DB_PATH = join(
  homedir(),
  "Library",
  "Application Support",
  "Daylens",
  "daylens.sqlite"
);

function openDb(): DatabaseSync {
  if (!existsSync(DB_PATH)) {
    throw new Error(
      `Daylens database not found at ${DB_PATH}. Is Daylens installed and has it tracked any activity?`
    );
  }
  return new DatabaseSync(DB_PATH, { open: true });
}

function resolveDate(db: DatabaseSync, dateArg?: string): string {
  if (dateArg) {
    const match = dateArg.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!match) throw new Error("Date must be in YYYY-MM-DD format");
    return match[1];
  }
  const row = db
    .prepare("SELECT date FROM work_context_blocks ORDER BY startTime DESC LIMIT 1")
    .get() as { date: string } | undefined;
  return row ? row.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(seconds)}s`;
}

// ── Tools ─────────────────────────────────────────────────────────────────────

function getTimeline(db: DatabaseSync, dateArg?: string): string {
  const date = resolveDate(db, dateArg);

  type BlockRow = {
    startTime: string; endTime: string; aiLabel: string | null;
    ruleBasedLabel: string; userLabel: string | null;
    dominantCategory: string; switchCount: number;
    confidence: string; narrative: string | null;
  };

  const blocks = db.prepare(
    `SELECT startTime, endTime, aiLabel, ruleBasedLabel, userLabel,
            dominantCategory, switchCount, confidence, narrative
     FROM work_context_blocks
     WHERE date(startTime) = date(?) OR date LIKE ?
     ORDER BY startTime ASC`
  ).all(date, `${date}%`) as BlockRow[];

  if (blocks.length === 0) return `No work blocks found for ${date}.`;

  const lines: string[] = [`Work timeline for ${date}:\n`];
  for (const b of blocks) {
    const start = b.startTime.slice(11, 16);
    const end = b.endTime.slice(11, 16);
    const label = b.userLabel ?? b.aiLabel ?? b.ruleBasedLabel ?? b.dominantCategory;
    const dur = formatDuration((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000);
    lines.push(`• ${start}–${end} (${dur}) — ${label}`);
    if (b.narrative) lines.push(`  ${b.narrative}`);
    lines.push(`  Category: ${b.dominantCategory} | Switches: ${b.switchCount} | Confidence: ${b.confidence}`);
  }
  return lines.join("\n");
}

function getFocusStats(db: DatabaseSync, dateArg?: string): string {
  const date = resolveDate(db, dateArg);

  type SummaryRow = {
    totalActiveTime: number; totalIdleTime: number; focusScore: number;
    longestFocusStreak: number; appCount: number; sessionCount: number;
    contextSwitches: number; topAppBundleID: string | null;
    topDomain: string | null; aiSummary: string | null;
  };

  const s = db.prepare(
    `SELECT totalActiveTime, totalIdleTime, focusScore, longestFocusStreak,
            appCount, sessionCount, contextSwitches, topAppBundleID, topDomain, aiSummary
     FROM daily_summaries WHERE date LIKE ? LIMIT 1`
  ).get(`${date}%`) as SummaryRow | undefined;

  if (!s) return `No daily summary found for ${date}. Daylens may not have finished computing it yet.`;

  const focusLabel = s.focusScore >= 0.8 ? "Deep Focus" : s.focusScore >= 0.6 ? "Focused"
    : s.focusScore >= 0.4 ? "Mixed" : s.focusScore >= 0.2 ? "Scattered" : "Fragmented";

  const lines = [
    `Focus stats for ${date}:\n`,
    `Active time:      ${formatDuration(s.totalActiveTime)}`,
    `Focus score:      ${Math.round(s.focusScore * 100)}% (${focusLabel})`,
    `Longest streak:   ${formatDuration(s.longestFocusStreak)}`,
    `Context switches: ${s.contextSwitches}`,
    `Apps used:        ${s.appCount}`,
    `Sessions:         ${s.sessionCount}`,
  ];
  if (s.topAppBundleID) lines.push(`Top app:          ${s.topAppBundleID}`);
  if (s.topDomain) lines.push(`Top domain:       ${s.topDomain}`);
  if (s.aiSummary) lines.push(`\nAI summary:\n${s.aiSummary}`);
  return lines.join("\n");
}

function getAppUsage(db: DatabaseSync, dateArg?: string): string {
  const date = resolveDate(db, dateArg);

  type AppRow = {
    appName: string; bundleID: string; category: string;
    isBrowser: number; totalDuration: number; sessionCount: number;
  };

  const rows = db.prepare(
    `SELECT appName, bundleID, category, isBrowser,
            SUM(duration) as totalDuration, COUNT(*) as sessionCount
     FROM app_sessions
     WHERE date(startTime) = date(?) OR date LIKE ?
     GROUP BY bundleID ORDER BY totalDuration DESC LIMIT 20`
  ).all(date, `${date}%`) as AppRow[];

  if (rows.length === 0) return `No app usage data found for ${date}.`;

  const lines = [`App usage for ${date}:\n`];
  for (const r of rows) {
    const browser = r.isBrowser ? " (browser)" : "";
    lines.push(`• ${r.appName}${browser}: ${formatDuration(r.totalDuration)} across ${r.sessionCount} session(s) [${r.category}]`);
  }
  return lines.join("\n");
}

function searchWork(db: DatabaseSync, query: string, days: number = 7): string {
  type BlockRow = {
    startTime: string; endTime: string; aiLabel: string | null;
    ruleBasedLabel: string; userLabel: string | null;
    dominantCategory: string; narrative: string | null;
  };

  const rows = db.prepare(
    `SELECT startTime, endTime, aiLabel, ruleBasedLabel, userLabel, dominantCategory, narrative
     FROM work_context_blocks
     WHERE startTime >= datetime('now', ?)
       AND (lower(aiLabel) LIKE lower(?) OR lower(ruleBasedLabel) LIKE lower(?)
         OR lower(userLabel) LIKE lower(?) OR lower(dominantCategory) LIKE lower(?)
         OR lower(narrative) LIKE lower(?))
     ORDER BY startTime DESC LIMIT 30`
  ).all(`-${days} days`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`) as BlockRow[];

  if (rows.length === 0) return `No work sessions matching "${query}" found in the last ${days} days.`;

  const lines = [`Work sessions matching "${query}" (last ${days} days):\n`];
  for (const r of rows) {
    const dur = formatDuration((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 1000);
    const label = r.userLabel ?? r.aiLabel ?? r.ruleBasedLabel ?? r.dominantCategory;
    lines.push(`• ${r.startTime.slice(0, 16)} (${dur}) — ${label}`);
    if (r.narrative) lines.push(`  ${r.narrative}`);
  }
  return lines.join("\n");
}

function getRecentActivity(db: DatabaseSync, minutes: number = 60): string {
  type BlockRow = {
    startTime: string; endTime: string; aiLabel: string | null;
    ruleBasedLabel: string; userLabel: string | null;
    dominantCategory: string; switchCount: number; narrative: string | null;
  };
  type AppRow = { appName: string; category: string; dur: number };

  const blocks = db.prepare(
    `SELECT startTime, endTime, aiLabel, ruleBasedLabel, userLabel,
            dominantCategory, switchCount, narrative
     FROM work_context_blocks WHERE startTime >= datetime('now', ?)
     ORDER BY startTime ASC`
  ).all(`-${minutes} minutes`) as BlockRow[];

  const apps = db.prepare(
    `SELECT appName, category, SUM(duration) as dur FROM app_sessions
     WHERE startTime >= datetime('now', ?)
     GROUP BY bundleID ORDER BY dur DESC LIMIT 8`
  ).all(`-${minutes} minutes`) as AppRow[];

  if (blocks.length === 0 && apps.length === 0) return `No activity in the last ${minutes} minutes.`;

  const lines = [`Activity in the last ${minutes} minutes:\n`];
  if (blocks.length > 0) {
    lines.push("Work blocks:");
    for (const b of blocks) {
      const dur = formatDuration((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000);
      const label = b.userLabel ?? b.aiLabel ?? b.ruleBasedLabel ?? b.dominantCategory;
      lines.push(`  • (${dur}) ${label} — ${b.switchCount} context switches`);
      if (b.narrative) lines.push(`    ${b.narrative}`);
    }
    lines.push("");
  }
  if (apps.length > 0) {
    lines.push("Apps:");
    for (const a of apps) {
      lines.push(`  • ${a.appName}: ${formatDuration(a.dur)} [${a.category}]`);
    }
  }
  return lines.join("\n");
}

// ── Server ────────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "daylens-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_timeline",
      description: "Get your Daylens work timeline for a day — labeled work blocks with durations and context. Defaults to today.",
      inputSchema: {
        type: "object",
        properties: { date: { type: "string", description: "YYYY-MM-DD. Defaults to today." } },
      },
    },
    {
      name: "get_focus_stats",
      description: "Get focus score, active time, and productivity metrics from Daylens. Defaults to today.",
      inputSchema: {
        type: "object",
        properties: { date: { type: "string", description: "YYYY-MM-DD. Defaults to today." } },
      },
    },
    {
      name: "get_app_usage",
      description: "Get a breakdown of which apps you used and for how long. Defaults to today.",
      inputSchema: {
        type: "object",
        properties: { date: { type: "string", description: "YYYY-MM-DD. Defaults to today." } },
      },
    },
    {
      name: "search_work",
      description: "Search Daylens work history by app name, label, category, or description.",
      inputSchema: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string", description: "Search term." },
          days: { type: "number", description: "Days back to search. Defaults to 7." },
        },
      },
    },
    {
      name: "get_recent_activity",
      description: "See what you've been doing in the last N minutes according to Daylens.",
      inputSchema: {
        type: "object",
        properties: { minutes: { type: "number", description: "Minutes to look back. Defaults to 60." } },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const input = (args ?? {}) as Record<string, unknown>;
  let db: DatabaseSync | undefined;
  try {
    db = openDb();
    let text: string;
    switch (name) {
      case "get_timeline":       text = getTimeline(db, input.date as string | undefined); break;
      case "get_focus_stats":    text = getFocusStats(db, input.date as string | undefined); break;
      case "get_app_usage":      text = getAppUsage(db, input.date as string | undefined); break;
      case "search_work":        text = searchWork(db, input.query as string, input.days as number | undefined); break;
      case "get_recent_activity":text = getRecentActivity(db, input.minutes as number | undefined); break;
      default: throw new Error(`Unknown tool: ${name}`);
    }
    return { content: [{ type: "text", text }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  } finally {
    db?.close();
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
