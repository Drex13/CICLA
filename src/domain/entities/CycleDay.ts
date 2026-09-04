// src/domain/entities/CycleDay.ts
// La entidad más importante: un día registrado dentro de un ciclo.
// Inmutable (regla R06) — nunca se muta, se reemplaza.

import type { CervicalMucus } from '@domain/entities/CervicalMucus';

export type BleedingLevel = 'light' | 'medium' | 'heavy';

export interface CervixPosition {
  readonly height: 'low' | 'medium' | 'high';
  readonly opening: 'closed' | 'slightly_open' | 'open';
  readonly firmness: 'firm' | 'medium' | 'soft';
}

export interface CycleDay {
  readonly id: string; // UUID
  readonly cycleId: string; // FK al ciclo
  readonly date: Date;
  readonly dayNumber: number; // Día 1, 2, 3... del ciclo
  readonly basalTemp?: number; // °C, precisión 0.01. Ausente si no se registró.
  readonly mucusType: CervicalMucus;
  readonly bleedingLevel?: BleedingLevel; // Ausente si no hubo sangrado
  readonly cervixPosition?: CervixPosition; // Registro opcional del cérvix
  readonly isPeakDay: boolean; // Marcado manualmente por la usuaria
  readonly notes: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
