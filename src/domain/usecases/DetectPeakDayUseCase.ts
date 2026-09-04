// src/domain/usecases/DetectPeakDayUseCase.ts
// Peak Day = último día con moco `egg_white`/`watery` seguido de un descenso
// en la fertilidad del moco (regreso a `sticky`/`creamy`/`none`). Si la usuaria
// marcó un día manualmente (`isPeakDay`), esa marca tiene prioridad.
// Lógica pura y síncrona (no puede "fallar": devuelve null si aún no hay peak).

import type { CycleDay } from '@domain/entities/CycleDay';
import {
  MUCUS_FERTILITY_RANK,
  PEAK_MUCUS_TYPES,
} from '@shared/constants/stmConstants';

export interface DetectPeakDayInput {
  readonly daysInCycle: readonly CycleDay[];
}

export interface PeakDayResult {
  /** dayNumber del Peak Day, o `null` si todavía no puede confirmarse. */
  readonly peakDayNumber: number | null;
  /** Cómo se determinó: marca manual o detección por moco. */
  readonly source: 'manual' | 'mucus' | null;
}

export interface IDetectPeakDayUseCase {
  execute(input: DetectPeakDayInput): PeakDayResult;
}

export class DetectPeakDayUseCase implements IDetectPeakDayUseCase {
  execute(input: DetectPeakDayInput): PeakDayResult {
    const sorted = [...input.daysInCycle].sort(
      (a, b) => a.dayNumber - b.dayNumber
    );

    // 1. La marca manual manda: se toma la última.
    const lastManual = [...sorted].reverse().find((d) => d.isPeakDay === true);
    if (lastManual !== undefined) {
      return { peakDayNumber: lastManual.dayNumber, source: 'manual' };
    }

    // 2. Detección por moco: último día "pico" seguido de un descenso.
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      const day = sorted[i];
      const next = sorted[i + 1];
      if (day === undefined || next === undefined) continue;
      const isPeakMucus = PEAK_MUCUS_TYPES.includes(day.mucusType);
      const dried =
        MUCUS_FERTILITY_RANK[next.mucusType] <
        MUCUS_FERTILITY_RANK[day.mucusType];
      if (isPeakMucus && dried) {
        return { peakDayNumber: day.dayNumber, source: 'mucus' };
      }
    }

    return { peakDayNumber: null, source: null };
  }
}
