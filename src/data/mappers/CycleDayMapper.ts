// src/data/mappers/CycleDayMapper.ts
// Traducción fila SQLite ↔ entidad del dominio (doc §9.2). Sin mappers, la forma
// de la DB se filtra hacia arriba y contamina el dominio.

import type { CycleDayRow } from '@data/database/schema';
import type { CervicalMucus } from '@domain/entities/CervicalMucus';
import type {
  BleedingLevel,
  CervixPosition,
  CycleDay,
} from '@domain/entities/CycleDay';
import type { CycleDayDraft } from '@domain/repositories/ICycleDayRepository';
import { civilDayKey } from '@shared/utils/dateUtils';

type CervixHeight = CervixPosition['height'];
type CervixOpening = CervixPosition['opening'];
type CervixFirmness = CervixPosition['firmness'];

export interface RowMeta {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const readCervix = (row: CycleDayRow): CervixPosition | undefined => {
  if (
    row.cervixHeight === null ||
    row.cervixOpening === null ||
    row.cervixFirmness === null
  ) {
    return undefined;
  }
  return {
    height: row.cervixHeight as CervixHeight,
    opening: row.cervixOpening as CervixOpening,
    firmness: row.cervixFirmness as CervixFirmness,
  };
};

export const CycleDayMapper = {
  /** Fila de DB → entidad del dominio (inmutable). Omite claves opcionales
   *  ausentes para respetar exactOptionalPropertyTypes. */
  toDomain(row: CycleDayRow): CycleDay {
    const cervixPosition = readCervix(row);
    return {
      id: row.id,
      cycleId: row.cycleId,
      date: new Date(row.date),
      dayNumber: row.dayNumber,
      mucusType: row.mucusType as CervicalMucus,
      isPeakDay: row.isPeakDay,
      notes: row.notes,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      ...(row.basalTemp !== null ? { basalTemp: row.basalTemp } : {}),
      ...(row.bleedingLevel !== null
        ? { bleedingLevel: row.bleedingLevel as BleedingLevel }
        : {}),
      ...(cervixPosition !== undefined ? { cervixPosition } : {}),
    };
  },

  /**
   * Datos del dominio → fila completa para escribir en DB. El draft es la
   * representación total del día: las claves opcionales ausentes se persisten
   * como NULL (un "save" reemplaza el estado del día, doc §4.2 upsert).
   */
  toPersistence(draft: CycleDayDraft, meta: RowMeta): CycleDayRow {
    return {
      id: meta.id,
      cycleId: draft.cycleId,
      date: civilDayKey(draft.date),
      dayNumber: draft.dayNumber,
      basalTemp: draft.basalTemp ?? null,
      mucusType: draft.mucusType,
      bleedingLevel: draft.bleedingLevel ?? null,
      cervixHeight: draft.cervixPosition?.height ?? null,
      cervixOpening: draft.cervixPosition?.opening ?? null,
      cervixFirmness: draft.cervixPosition?.firmness ?? null,
      isPeakDay: draft.isPeakDay,
      notes: draft.notes,
      createdAt: meta.createdAt.getTime(),
      updatedAt: meta.updatedAt.getTime(),
    };
  },
};
