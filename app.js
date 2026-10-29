/**
 * app.js - Production Entry Point for GoDaddy cPanel / Phusion Passenger / PM2
 * 
 * In GoDaddy cPanel "Setup Node.js App", set:
 *   - Application startup file: app.js
 * 
 * This file launches the full-stack server using local tsx.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverScript = path.join(__dirname, 'server.ts');
const localTsxBin = path.join(__dirname, 'node_modules', '.bin', 'tsx');
const isLocalTsx = fs.existsSync(localTsxBin);

const bin = isLocalTsx ? localTsxBin : 'npx';
const args = isLocalTsx ? [serverScript] : ['tsx', serverScript];

const child = spawn(bin, args, {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

child.on('error', (err) => {
  console.error('[GoDaddy Startup Error]: Failed to launch server:', err.message);
});

child.on('close', (code) => {
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
