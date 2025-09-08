import { getDb } from './db';
import { supabase } from './supabase';

export async function syncUp(): Promise<void> {
  // TODO: push local changes to Supabase
  void getDb();
  void supabase;
}

export async function syncDown(): Promise<void> {
  // TODO: pull changes from Supabase to local SQLite
  void getDb();
  void supabase;
}


