// src/data/mappers/CycleMapper.ts
// Traducción fila SQLite ↔ entidad Cycle del dominio.

import type { CycleRow } from '@data/database/schema';
import type { RowMeta } from '@data/mappers/CycleDayMapper';
import type { Cycle } from '@domain/entities/Cycle';
import type { CycleDraft } from '@domain/repositories/ICycleRepository';

export const CycleMapper = {
  toDomain(row: CycleRow): Cycle {
    return {
      id: row.id,
      startDate: new Date(row.startDate),
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      ...(row.endDate !== null ? { endDate: new Date(row.endDate) } : {}),
    };
  },

  toPersistence(draft: CycleDraft, meta: RowMeta): CycleRow {
    return {
      id: meta.id,
      startDate: draft.startDate.getTime(),
      endDate: draft.endDate ? draft.endDate.getTime() : null,
      isActive: draft.isActive,
      createdAt: meta.createdAt.getTime(),
      updatedAt: meta.updatedAt.getTime(),
    };
  },
};
