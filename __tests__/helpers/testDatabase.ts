// __tests__/helpers/testDatabase.ts
// Base de datos SQLite REAL en memoria para los tests de integración de la capa
// de datos (doc §11.1). Usa libsql (sin compilación nativa, va en Node) con el
// mismo schema Drizzle que la app.

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { applySchema, schema, type AppDatabase } from '@data/database/schema';
import { DatabaseChangeBus } from '@data/database/changeBus';

export interface TestDatabase {
  readonly db: AppDatabase;
  readonly changeBus: DatabaseChangeBus;
}

export const makeTestDatabase = async (): Promise<TestDatabase> => {
  const client = createClient({ url: ':memory:' });
  const db = drizzle(client, { schema }) as unknown as AppDatabase;
  await applySchema(db);
  return { db, changeBus: new DatabaseChangeBus() };
};

let counter = 0;
/** Generador de ids determinista para asserts estables en tests. */
export const sequentialIds = (): (() => string) => {
  const base = (counter += 1);
  let n = 0;
  return () => `test-${base}-${(n += 1)}`;
};
