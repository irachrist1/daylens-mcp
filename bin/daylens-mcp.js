#!/usr/bin/env node
// Wrapper that spawns the MCP server with --no-warnings to keep stdio clean
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = spawn(
  process.execPath,
  ['--no-warnings', join(__dirname, '../dist/index.js')],
  { stdio: 'inherit', env: process.env }
);

server.on('exit', (code) => process.exit(code ?? 0));
server.on('error', (err) => { process.stderr.write(err.message + '\n'); process.exit(1); });
