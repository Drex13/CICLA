// src/data/models/rows.ts
// Con Drizzle, el "modelo" de persistencia es la fila inferida del schema.
// Se re-exportan aquí para que el resto de la capa de datos no importe el
// schema entero cuando solo necesita los tipos de fila.

export type {
  CycleRow,
  CycleInsert,
  CycleDayRow,
  CycleDayInsert,
} from '@data/database/schema';
