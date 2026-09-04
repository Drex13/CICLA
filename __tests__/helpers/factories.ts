// __tests__/helpers/factories.ts
// Constructores de datos de prueba para el dominio STM.

import type { Cycle } from '@domain/entities/Cycle';
import type { CycleDay } from '@domain/entities/CycleDay';

const BASE_CYCLE_START = new Date(2026, 0, 1); // 2026-01-01, día 1

export interface CycleDaySeed {
  dayNumber: number;
  basalTemp?: number;
  mucusType?: CycleDay['mucusType'];
  bleedingLevel?: CycleDay['bleedingLevel'];
  cervixPosition?: CycleDay['cervixPosition'];
  isPeakDay?: boolean;
  notes?: string;
  cycleId?: string;
  date?: Date;
}

const dayDate = (dayNumber: number): Date => {
  const d = new Date(BASE_CYCLE_START);
  d.setDate(d.getDate() + (dayNumber - 1));
  return d;
};

/** Construye un CycleDay completo a partir de una semilla mínima. */
export const buildCycleDay = (seed: CycleDaySeed): CycleDay => {
  const now = new Date(2026, 0, seed.dayNumber, 7, 0, 0);
  return {
    id: `day-${seed.cycleId ?? 'current'}-${seed.dayNumber}`,
    cycleId: seed.cycleId ?? 'cycle-current',
    date: seed.date ?? dayDate(seed.dayNumber),
    dayNumber: seed.dayNumber,
    mucusType: seed.mucusType ?? 'none',
    isPeakDay: seed.isPeakDay ?? false,
    notes: seed.notes ?? '',
    createdAt: now,
    updatedAt: now,
    ...(seed.basalTemp !== undefined ? { basalTemp: seed.basalTemp } : {}),
    ...(seed.bleedingLevel !== undefined
      ? { bleedingLevel: seed.bleedingLevel }
      : {}),
    ...(seed.cervixPosition !== undefined
      ? { cervixPosition: seed.cervixPosition }
      : {}),
  };
};

/** Construye una lista de CycleDay ordenada por dayNumber. */
export const buildTestCycleDays = (
  seeds: readonly CycleDaySeed[]
): CycleDay[] =>
  seeds.map(buildCycleDay).sort((a, b) => a.dayNumber - b.dayNumber);

/**
 * `count` ciclos previos "completos" mínimos. Solo importa su cantidad para la
 * comprobación de datos suficientes; el contenido es un ciclo ovulatorio simple.
 */
export const buildPreviousCycles = (count: number): CycleDay[][] =>
  Array.from({ length: count }, (_unused, i) =>
    buildTestCycleDays([
      {
        dayNumber: 1,
        basalTemp: 36.4,
        mucusType: 'none',
        cycleId: `prev-${i}`,
      },
      {
        dayNumber: 6,
        basalTemp: 36.35,
        mucusType: 'sticky',
        cycleId: `prev-${i}`,
      },
      {
        dayNumber: 10,
        basalTemp: 36.4,
        mucusType: 'egg_white',
        cycleId: `prev-${i}`,
      },
      {
        dayNumber: 12,
        basalTemp: 36.7,
        mucusType: 'sticky',
        cycleId: `prev-${i}`,
      },
      {
        dayNumber: 13,
        basalTemp: 36.8,
        mucusType: 'none',
        cycleId: `prev-${i}`,
      },
      {
        dayNumber: 14,
        basalTemp: 36.9,
        mucusType: 'none',
        cycleId: `prev-${i}`,
      },
    ])
  );

export const buildCycle = (partial: Partial<Cycle> = {}): Cycle => {
  const now = new Date(2026, 0, 1, 6, 0, 0);
  return {
    id: partial.id ?? 'cycle-current',
    startDate: partial.startDate ?? new Date(2026, 0, 1),
    isActive: partial.isActive ?? true,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    ...(partial.endDate !== undefined ? { endDate: partial.endDate } : {}),
  };
};
