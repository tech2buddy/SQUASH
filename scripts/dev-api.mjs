#!/usr/bin/env node
// Loads .env.local into this process's own environment, then spawns
// `vercel dev` as a child of it, so the API functions inherit the values
// directly instead of relying on `vercel dev` to load them itself.
//
// Why this exists: in this project (vercel.json delegates the dev command
// to `vite --port $PORT`), `vercel dev` does not reliably load `.env.local`
// or auto-pull the linked project's Development environment variables into
// its own function runtime -- confirmed by direct testing, twice, on two
// different machines' worth of debugging. Without this wrapper, `/api/*`
// routes silently see missing credentials with no indication why.
//
// Deliberately unconditional: every key found in .env.local overrides
// whatever the OS process environment already has, even if already set.
// This is not the usual "don't clobber an explicit override" convention --
// it is the point. A stray machine-level environment variable (set once,
// long ago, for an unrelated project) silently shadowed the correct
// Supabase project for this entire session and was very hard to diagnose,
// because nothing here failed loudly; it just quietly talked to the wrong
// backend. .env.local, tracked by nobody but committed to nowhere
// (gitignored), is meant to be the actual source of truth for local API
// dev -- so it must always win.

import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import console from 'node:console';
import process from 'node:process';

const ENV_FILE = '.env.local';

function loadEnvFile(path) {
  if (!existsSync(path)) {
    console.warn(`[dev-api] ${path} not found -- API routes will run with whatever the OS environment already provides.`);
    return;
  }
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  let applied = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!key) continue;
    process.env[key] = value;
    applied++;
  }
  console.log(`[dev-api] Loaded ${applied} variable(s) from ${path} into this process.`);
}

loadEnvFile(ENV_FILE);

const child = spawn('npx', ['vercel', 'dev', '--listen', '3000', '--yes'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (error) => {
  console.error('[dev-api] Failed to start vercel dev:', error);
  process.exit(1);
});
