#!/usr/bin/env bun
// ============================================================================
// CMS Development Environment Setup Script (Cross-platform, runs with Bun)
// ============================================================================
// Usage: bun run setup
//
// This script sets up the local development environment:
// 1. Verifies Docker is running
// 2. Starts PostgreSQL container
// 3. Waits for database to be healthy
// 4. Installs dependencies
// 5. Creates .env files from .env.example
// 6. Runs database migrations
// 7. Seeds the database with demo data
// ============================================================================

import { existsSync, copyFileSync } from 'fs';
import { resolve } from 'path';

const ROOT_DIR = resolve(import.meta.dirname, '..');
const BACKEND_DIR = resolve(ROOT_DIR, 'apps', 'backend');
const ENV_EXAMPLE = resolve(ROOT_DIR, '.env.example');
const ENV_ROOT = resolve(ROOT_DIR, '.env');
const ENV_BACKEND = resolve(BACKEND_DIR, '.env');

const CONTAINER_NAME = 'cms-postgres';
const MAX_HEALTH_ATTEMPTS = 30;
const HEALTH_CHECK_INTERVAL_MS = 2000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const gray = (text: string) => `\x1b[90m${text}\x1b[0m`;

const info = (msg: string) => console.log(`${cyan('[INFO]')} ${msg}`);
const success = (msg: string) => console.log(`${green('[OK]')} ${msg}`);
const error = (msg: string) => console.log(`${red('[ERROR]')} ${msg}`);
const warn = (msg: string) => console.log(`${yellow('[WARN]')} ${msg}`);

async function run(cmd: string[], cwd = ROOT_DIR): Promise<{ ok: boolean; output: string }> {
  const proc = Bun.spawn(cmd, {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { ok: exitCode === 0, output: (stdout + stderr).trim() };
}

async function runPassthrough(cmd: string[], cwd = ROOT_DIR): Promise<boolean> {
  const proc = Bun.spawn(cmd, {
    cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const exitCode = await proc.exited;
  return exitCode === 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

async function checkDocker(): Promise<void> {
  info('Checking if Docker is running...');
  const { ok } = await run(['docker', 'info']);

  if (!ok) {
    error('Docker is not running or not installed!');
    console.log('');
    console.log(yellow('Please make sure Docker Desktop is installed and running.'));
    console.log(yellow('Download from: https://www.docker.com/products/docker-desktop'));
    console.log('');
    process.exit(1);
  }

  success('Docker is running');
}

async function startCompose(): Promise<void> {
  console.log('');
  info('Stopping existing containers and removing volumes for a clean database...');
  await run(['docker-compose', 'down', '-v'], ROOT_DIR);

  info('Starting Docker Compose services...');

  const ok = await runPassthrough(['docker-compose', 'up', '-d'], ROOT_DIR);
  if (!ok) {
    error('Failed to start Docker Compose services!');
    process.exit(1);
  }

  success('Docker Compose services started');
}

async function waitForPostgres(): Promise<void> {
  console.log('');
  info('Waiting for PostgreSQL to be healthy...');

  for (let attempt = 1; attempt <= MAX_HEALTH_ATTEMPTS; attempt++) {
    const { ok, output } = await run([
      'docker',
      'inspect',
      '--format={{.State.Health.Status}}',
      CONTAINER_NAME,
    ]);

    const status = ok ? output.trim() : 'starting';

    if (status === 'healthy') {
      success('PostgreSQL is healthy!');
      return;
    }

    console.log(gray(`  Attempt ${attempt}/${MAX_HEALTH_ATTEMPTS} - Status: ${status}`));
    await sleep(HEALTH_CHECK_INTERVAL_MS);
  }

  error(`PostgreSQL failed to become healthy after ${MAX_HEALTH_ATTEMPTS} attempts!`);
  console.log('');
  console.log(yellow('Troubleshooting:'));
  console.log(yellow(`  1. Check container logs: docker logs ${CONTAINER_NAME}`));
  console.log(yellow('  2. Check container status: docker-compose ps'));
  console.log(yellow('  3. Try restarting: docker-compose down && docker-compose up -d'));
  console.log('');
  process.exit(1);
}

async function installDeps(): Promise<void> {
  console.log('');
  info('Installing dependencies with Bun...');

  const ok = await runPassthrough(['bun', 'install'], ROOT_DIR);
  if (!ok) {
    error('Failed to install dependencies!');
    console.log(yellow('Make sure Bun is installed: https://bun.sh'));
    process.exit(1);
  }

  success('Dependencies installed');
}

function copyEnvFiles(): void {
  console.log('');
  info('Setting up environment files...');

  if (!existsSync(ENV_EXAMPLE)) {
    error('.env.example not found in project root!');
    process.exit(1);
  }

  let created = false;

  if (!existsSync(ENV_ROOT)) {
    copyFileSync(ENV_EXAMPLE, ENV_ROOT);
    success('.env created in project root');
    created = true;
  } else {
    info('.env already exists in project root, skipping');
  }

  if (!existsSync(ENV_BACKEND)) {
    copyFileSync(ENV_EXAMPLE, ENV_BACKEND);
    success('.env created in apps/backend/');
    created = true;
  } else {
    info('.env already exists in apps/backend/, skipping');
  }

  if (created) {
    warn('Review and update .env files with your settings if needed!');
  }
}

async function runMigrations(): Promise<void> {
  console.log('');
  info('Running database migrations...');

  const ok = await runPassthrough(['bun', 'run', 'db:migrate'], ROOT_DIR);
  if (!ok) {
    error('Database migrations failed!');
    console.log(yellow('Check your DATABASE_URL in .env and ensure PostgreSQL is running.'));
    process.exit(1);
  }

  success('Database migrations applied');
}

async function seedDatabase(): Promise<void> {
  console.log('');
  info('Seeding database with demo data...');

  const ok = await runPassthrough(['bun', 'run', 'db:seed'], ROOT_DIR);
  if (!ok) {
    error('Database seeding failed!');
    console.log(yellow('Make sure migrations have been applied first.'));
    process.exit(1);
  }

  success('Database seeded');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('');
  console.log(cyan('=========================================='));
  console.log(cyan('   CMS Development Environment Setup'));
  console.log(cyan('=========================================='));
  console.log('');

  await checkDocker();
  await startCompose();
  await waitForPostgres();
  await installDeps();
  copyEnvFiles();
  await runMigrations();
  await seedDatabase();

  console.log('');
  console.log(green('=========================================='));
  console.log(green('   Setup Complete!'));
  console.log(green('=========================================='));
  console.log('');
  console.log(cyan('Start the development server:'));
  console.log('');
  console.log(`  ${yellow('bun run dev')}`);
  console.log('');
  console.log(cyan('Then open:'));
  console.log(`  Frontend:    ${yellow('http://localhost:5173')}`);
  console.log(`  Backend API: ${yellow('http://localhost:3000')}`);
  console.log(`  Swagger:     ${yellow('http://localhost:3000/swagger')}`);
  console.log('');
  console.log(cyan('Login credentials:'));
  console.log(`  Admin:  ${yellow('admin@example.com')} / ${yellow('admin123!@#')}`);
  console.log(`  Editor: ${yellow('editor@example.com')} / ${yellow('editor123!@#')}`);
  console.log('');
  console.log(gray('Useful commands:'));
  console.log(gray('  docker-compose ps      - Check container status'));
  console.log(gray('  docker-compose logs    - View container logs'));
  console.log(gray('  docker-compose down    - Stop containers'));
  console.log('');
}

main();
