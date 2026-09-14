import fs from 'fs';
import path from 'path';

const dbFiles = [
  path.resolve(process.cwd(), 'verdict.db'),
  path.resolve(process.cwd(), 'verdict.db-wal'),
  path.resolve(process.cwd(), 'verdict.db-shm'),
  path.resolve(process.cwd(), 'verdict.db-journal'),
];

console.log('=== Step 1: Deleting existing database files ===');
for (const file of dbFiles) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Deleted: ${path.basename(file)}`);
  }
}

// Verify deletion
const remaining = dbFiles.filter((f) => fs.existsSync(f));
if (remaining.length > 0) {
  console.error('Failed to delete files:', remaining);
  process.exit(1);
}
console.log('Clean slate confirmed: No database files present.\n');

console.log('=== Step 2: Fresh database initialization (initSchema call 1) ===');
// Import after deletion
const { initSchema, getDb } = require('../apps/api/src/db');

// First initSchema call
initSchema();

const db = getDb();
const expectedTables = [
  'action_requests',
  'agent_capabilities',
  'agents',
  'audit_trail_entries',
  'docket_entries',
];

function getTables(): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

function getIndices(): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

const tablesAfterFirstInit = getTables();
console.log('Tables present after first initialization:');
for (const t of tablesAfterFirstInit) {
  console.log(`  - ${t}`);
}

const all5Present =
  expectedTables.length === tablesAfterFirstInit.length &&
  expectedTables.every((t) => tablesAfterFirstInit.includes(t));

if (!all5Present) {
  console.error('ERROR: Missing or unexpected tables after first init!');
  process.exit(1);
}
console.log('PASS: All 5 tables successfully created on clean startup.\n');

console.log('=== Step 3: Idempotency check (initSchema call 2) ===');
try {
  initSchema();
  console.log('initSchema() second execution completed without throwing any errors.');
} catch (err) {
  console.error('FAIL: initSchema() threw an error on second run:', err);
  process.exit(1);
}

const tablesAfterSecondInit = getTables();
const indicesAfterSecondInit = getIndices();

console.log(`Tables after second run (${tablesAfterSecondInit.length}):`, tablesAfterSecondInit.join(', '));
console.log(`Indices after second run (${indicesAfterSecondInit.length}):`, indicesAfterSecondInit.join(', '));

const tablesUnchanged =
  tablesAfterSecondInit.length === 5 &&
  expectedTables.every((t) => tablesAfterSecondInit.includes(t));

if (!tablesUnchanged) {
  console.error('FAIL: Tables were duplicated or corrupted after second init!');
  process.exit(1);
}

console.log('\nPASS: initSchema() is strictly idempotent. All 5 tables intact with zero duplication.');
db.close();
process.exit(0);
