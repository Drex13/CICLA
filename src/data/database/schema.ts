// src/data/database/schema.ts
// Schema de la base de datos (Drizzle + SQLite). Reemplaza al appSchema de
// WatermelonDB del doc §9.1 (WatermelonDB no es fiable en la New Architecture).
// Las columnas y sus tipos siguen el mismo diseño del documento.

import { sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const cycles = sqliteTable('cycles', {
  id: text('id').primaryKey(),
  startDate: integer('start_date').notNull(), // timestamp Unix (ms)
  endDate: integer('end_date'), // null mientras el ciclo está activo
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const cycleDays = sqliteTable(
  'cycle_days',
  {
    id: text('id').primaryKey(),
    cycleId: text('cycle_id')
      .notNull()
      .references(() => cycles.id),
    date: integer('date').notNull(), // timestamp Unix (ms), medianoche civil
    dayNumber: integer('day_number').notNull(),
    basalTemp: real('basal_temp'), // null si no se registró
    mucusType: text('mucus_type').notNull(), // enum como string
    bleedingLevel: text('bleeding_level'),
    cervixHeight: text('cervix_height'),
    cervixOpening: text('cervix_opening'),
    cervixFirmness: text('cervix_firmness'),
    isPeakDay: integer('is_peak_day', { mode: 'boolean' }).notNull(),
    notes: text('notes').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('cycle_days_cycle_id_idx').on(t.cycleId),
    uniqueIndex('cycle_days_date_idx').on(t.date), // un registro por fecha
  ]
);

export const schema = { cycles, cycleDays };

export type CycleRow = typeof cycles.$inferSelect;
export type CycleInsert = typeof cycles.$inferInsert;
export type CycleDayRow = typeof cycleDays.$inferSelect;
export type CycleDayInsert = typeof cycleDays.$inferInsert;

/**
 * Instancia Drizzle sobre SQLite. Los repositorios se tipan contra esto.
 * La app usa el driver de expo-sqlite (síncrono) y lo castea a este tipo en
 * client.ts; los tests usan el driver libsql (asíncrono) directamente. Ambos
 * comparten la misma API de consulta, así que el código de los repos —que hace
 * `await`— funciona con los dos en runtime.
 */
export type AppDatabase = LibSQLDatabase<typeof schema>;

/**
 * Crea las tablas e índices si no existen. Se usa en el arranque de la app y en
 * el setup de los tests de integración. (Las migraciones versionadas con
 * drizzle-kit se añadirán en el endurecimiento de Fase 5.)
 */
export const SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS cycles (
     id TEXT PRIMARY KEY NOT NULL,
     start_date INTEGER NOT NULL,
     end_date INTEGER,
     is_active INTEGER NOT NULL,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS cycle_days (
     id TEXT PRIMARY KEY NOT NULL,
     cycle_id TEXT NOT NULL REFERENCES cycles(id),
     date INTEGER NOT NULL,
     day_number INTEGER NOT NULL,
     basal_temp REAL,
     mucus_type TEXT NOT NULL,
     bleeding_level TEXT,
     cervix_height TEXT,
     cervix_opening TEXT,
     cervix_firmness TEXT,
     is_peak_day INTEGER NOT NULL,
     notes TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS cycle_days_cycle_id_idx ON cycle_days (cycle_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS cycle_days_date_idx ON cycle_days (date)`,
];

export const applySchema = async (db: AppDatabase): Promise<void> => {
  for (const statement of SCHEMA_STATEMENTS) {
    await db.run(sql.raw(statement));
  }
};
