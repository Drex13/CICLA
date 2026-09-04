// src/data/database/client.ts
// Cliente de base de datos para la APP (usa expo-sqlite). Este archivo es el
// único de la capa de datos que toca un módulo nativo, por lo que NO debe ser
// importado por los tests (que usan libsql en memoria).

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { applySchema, schema, type AppDatabase } from '@data/database/schema';
import { DatabaseChangeBus } from '@data/database/changeBus';

export interface DatabaseContext {
  readonly db: AppDatabase;
  readonly changeBus: DatabaseChangeBus;
}

let context: DatabaseContext | null = null;

/**
 * Abre (una sola vez) la base de datos SQLite de la app, garantiza el schema y
 * devuelve el contexto compartido para inyectar en los repositorios.
 */
export const getDatabaseContext = async (): Promise<DatabaseContext> => {
  if (context !== null) return context;

  const sqlite = openDatabaseSync('cicla.db', { enableChangeListener: true });
  sqlite.execSync('PRAGMA foreign_keys = ON;');
  const db = drizzle(sqlite, { schema }) as unknown as AppDatabase;

  await applySchema(db);

  context = { db, changeBus: new DatabaseChangeBus() };
  return context;
};
