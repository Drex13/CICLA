// src/domain/usecases/DetermineBaselineTemperatureUseCase.ts
// Calcula la LDC (Línea de Cobertura): MAX de las últimas ≤6 temperaturas
// bajas preovulatorias. Excluye días sin temperatura (STM-010) y temperaturas
// fuera del rango normal — p.ej. fiebre (STM-008).
// Lógica pura y síncrona (regla R05: retorna Result, no lanza).

import type { CycleDay } from '@domain/entities/CycleDay';
import { validationError } from '@domain/entities/DomainError';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';
import { STM } from '@shared/constants/stmConstants';

export interface BaselineTemperature {
  /** LDC — umbral base sobre el que se mide el cambio térmico. */
  readonly coverline: number;
  /** dayNumber de las temperaturas bajas usadas para la LDC. */
  readonly sampleDayNumbers: readonly number[];
  /** Primer día con temperatura "alta" detectado, o `null` si no hay cambio. */
  readonly thermalShiftStartDayNumber: number | null;
  /** `true` si la LDC es tentativa (aún no se detectó cambio térmico). */
  readonly isProvisional: boolean;
}

export interface DetermineBaselineTemperatureInput {
  readonly daysInCycle: readonly CycleDay[];
  /** Si se indica, solo se consideran días con dayNumber ≤ este valor. */
  readonly asOfDayNumber?: number;
}

export interface IDetermineBaselineTemperatureUseCase {
  execute(
    input: DetermineBaselineTemperatureInput
  ): Result<BaselineTemperature>;
}

interface ValidTemp {
  readonly dayNumber: number;
  readonly temp: number;
}

const maxTemp = (samples: readonly ValidTemp[]): number =>
  samples.reduce(
    (hi, s) => (s.temp > hi ? s.temp : hi),
    Number.NEGATIVE_INFINITY
  );

export class DetermineBaselineTemperatureUseCase implements IDetermineBaselineTemperatureUseCase {
  execute(
    input: DetermineBaselineTemperatureInput
  ): Result<BaselineTemperature> {
    const { daysInCycle, asOfDayNumber } = input;

    const valid: ValidTemp[] = daysInCycle
      .filter(
        (d): d is CycleDay & { basalTemp: number } =>
          d.basalTemp !== undefined &&
          d.basalTemp >= STM.MIN_BASAL_TEMP_C &&
          d.basalTemp <= STM.MAX_BASAL_TEMP_C &&
          (asOfDayNumber === undefined || d.dayNumber <= asOfDayNumber)
      )
      .map((d) => ({ dayNumber: d.dayNumber, temp: d.basalTemp }))
      .sort((a, b) => a.dayNumber - b.dayNumber);

    if (valid.length === 0) {
      return err(
        validationError('No hay temperaturas válidas para calcular la LDC.', {
          daysConsidered: daysInCycle.length,
        })
      );
    }

    // Buscar el primer día cuya temperatura supera (max de las ≤6 previas) + 0.2.
    let shiftStartIndex: number | null = null;
    for (let k = 1; k < valid.length; k += 1) {
      const prior = valid.slice(Math.max(0, k - STM.LDC_SAMPLE_SIZE), k);
      if (prior.length < STM.MIN_LDC_SAMPLE_SIZE) continue;
      const ldcCandidate = maxTemp(prior);
      const current = valid[k];
      if (
        current !== undefined &&
        current.temp >= ldcCandidate + STM.TEMP_RISE_THRESHOLD
      ) {
        shiftStartIndex = k;
        break;
      }
    }

    if (shiftStartIndex !== null) {
      const sample = valid.slice(
        Math.max(0, shiftStartIndex - STM.LDC_SAMPLE_SIZE),
        shiftStartIndex
      );
      const shiftDay = valid[shiftStartIndex];
      return ok({
        coverline: maxTemp(sample),
        sampleDayNumbers: sample.map((s) => s.dayNumber),
        thermalShiftStartDayNumber: shiftDay ? shiftDay.dayNumber : null,
        isProvisional: false,
      });
    }

    // Sin cambio térmico: LDC tentativa con las últimas ≤6 temperaturas.
    const sample = valid.slice(-STM.LDC_SAMPLE_SIZE);
    return ok({
      coverline: maxTemp(sample),
      sampleDayNumbers: sample.map((s) => s.dayNumber),
      thermalShiftStartDayNumber: null,
      isProvisional: true,
    });
  }
}
