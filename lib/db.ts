import * as SQLite from 'expo-sqlite';

export type Database = SQLite.SQLiteDatabase;

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('billbuddy.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS waiters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pin TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'empty'
    );
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      waiter_id TEXT,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(table_id) REFERENCES tables(id)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax_pct REAL NOT NULL,
      discount_pct REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
    CREATE TABLE IF NOT EXISTS dues (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      photo_uri TEXT,
      created_at INTEGER NOT NULL,
      paid_at INTEGER,
      FOREIGN KEY(bill_id) REFERENCES bills(id)
    );
  `);
  return db;
}


