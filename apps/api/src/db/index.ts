import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = process.env.VERDICT_DB_PATH || path.resolve(process.cwd(), 'verdict.db');
    dbInstance = new Database(dbPath);
    // Enable WAL mode for better concurrency and enforce foreign key constraints
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

export function initSchema(): void {
  const db = getDb();
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  console.log('[Verdict DB] Schema initialized successfully (5 tables ready)');
}
