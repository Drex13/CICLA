// drizzle.config.ts
// Config de drizzle-kit para generar migraciones versionadas a partir del
// schema. En Fase 2 la app arranca con `applySchema()` (CREATE TABLE IF NOT
// EXISTS); las migraciones incrementales se activarán en el endurecimiento de
// Fase 5. Genera SQL con:  npx drizzle-kit generate
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/data/database/schema.ts',
  out: './src/data/database/migrations',
  dialect: 'sqlite',
} satisfies Config;
