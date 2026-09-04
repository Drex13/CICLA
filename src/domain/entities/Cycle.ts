// src/domain/entities/Cycle.ts
// Un ciclo menstrual completo. Agrupa a sus CycleDay por cycleId.
// Inmutable (regla R06). Diseñada según el schema de la sección 9.1.

import { daysBetweenCivil } from '@shared/utils/dateUtils';

export interface Cycle {
  readonly id: string; // UUID
  readonly startDate: Date; // Día 1 del ciclo (primer día de regla)
  readonly endDate?: Date; // Ausente mientras el ciclo está activo
  readonly isActive: boolean; // Solo un ciclo puede estar activo a la vez
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Longitud del ciclo en días (inclusiva). `null` si el ciclo sigue activo.
 * Cálculo puro sin dependencias — helper de conveniencia sobre la entidad,
 * no lógica de negocio (no aplica reglas STM).
 */
export const cycleLengthInDays = (cycle: Cycle): number | null => {
  if (cycle.endDate === undefined) return null;
  return daysBetweenCivil(cycle.startDate, cycle.endDate) + 1;
};
