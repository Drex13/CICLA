// src/domain/usecases/CalculateFertilityStatusUseCase.ts
// NÚCLEO DEL NEGOCIO. Aplica el Método Sintotérmico (doc §5.2) para decidir la
// fase de fertilidad de un día concreto. Pura y SÍNCRONA — solo matemática.
// Compone DetermineBaselineTemperature (LDC) y DetectPeakDay.

import type { CycleDay } from '@domain/entities/CycleDay';
import type {
  ConfidenceLevel,
  FertilityPhase,
  FertilityStatus,
} from '@domain/entities/FertilityStatus';
import {
  DetermineBaselineTemperatureUseCase,
  type BaselineTemperature,
  type IDetermineBaselineTemperatureUseCase,
} from '@domain/usecases/DetermineBaselineTemperatureUseCase';
import {
  DetectPeakDayUseCase,
  type IDetectPeakDayUseCase,
} from '@domain/usecases/DetectPeakDayUseCase';
import {
  STM,
  FERTILE_MUCUS_TYPES,
  PEAK_MUCUS_TYPES,
} from '@shared/constants/stmConstants';

export interface CalculateFertilityStatusInput {
  readonly currentDay: CycleDay;
  readonly allDaysInCycle: readonly CycleDay[];
  /** Ciclos previos completos (uno por array de días). */
  readonly previousCycles: readonly (readonly CycleDay[])[];
}

export interface ICalculateFertilityStatusUseCase {
  execute(input: CalculateFertilityStatusInput): FertilityStatus;
}

interface PhaseCopy {
  readonly message: string;
  readonly detail: string;
}

const COPY: Record<FertilityPhase, PhaseCopy> = {
  menstruation: {
    message: 'Menstruación',
    detail:
      'Días de regla. Se consideran potencialmente fértiles: los espermatozoides pueden sobrevivir varios días.',
  },
  dry_pre_ovulatory: {
    message: 'Días secos',
    detail:
      'Sin moco y sin cambio térmico. Fase preovulatoria de baja probabilidad, según la regla de los días secos.',
  },
  fertile_building: {
    message: 'Fertilidad en aumento',
    detail: 'Hay moco cervical presente. La ventana fértil está abierta.',
  },
  peak_phase: {
    message: 'Fase de Peak',
    detail:
      'Moco de máxima fertilidad (o Peak marcado). Probabilidad de embarazo más alta del ciclo.',
  },
  post_ovulatory_waiting: {
    message: 'Esperando confirmación',
    detail:
      'Aún no se cumplen ambas reglas (térmica y del moco). Se mantiene la precaución.',
  },
  post_ovulatory_infertile: {
    message: 'Infértil (post-ovulatorio)',
    detail:
      'Regla térmica y regla del moco confirmadas. Infertilidad post-ovulatoria hasta la próxima regla.',
  },
  insufficient_data: {
    message: 'Datos insuficientes',
    detail: `Se necesitan al menos ${STM.MIN_CYCLES_FOR_CALCULATION} ciclos completos para calcular con seguridad.`,
  },
};

interface ValidTemp {
  readonly dayNumber: number;
  readonly temp: number;
}

export class CalculateFertilityStatusUseCase implements ICalculateFertilityStatusUseCase {
  private readonly determineBaseline: IDetermineBaselineTemperatureUseCase;
  private readonly detectPeak: IDetectPeakDayUseCase;

  constructor(deps?: {
    determineBaseline?: IDetermineBaselineTemperatureUseCase;
    detectPeak?: IDetectPeakDayUseCase;
  }) {
    this.determineBaseline =
      deps?.determineBaseline ?? new DetermineBaselineTemperatureUseCase();
    this.detectPeak = deps?.detectPeak ?? new DetectPeakDayUseCase();
  }

  execute(input: CalculateFertilityStatusInput): FertilityStatus {
    const { currentDay, allDaysInCycle, previousCycles } = input;

    // PASO 1 — ¿Hay datos suficientes?
    if (previousCycles.length < STM.MIN_CYCLES_FOR_CALCULATION) {
      return this.build('insufficient_data', 'insufficient', true);
    }

    // PASO 2 — ¿Está menstruando?
    if (currentDay.bleedingLevel !== undefined) {
      return this.build('menstruation', 'probable', true);
    }

    // PASO 3 — LDC (Línea de Cobertura).
    const baselineResult = this.determineBaseline.execute({
      daysInCycle: allDaysInCycle,
      asOfDayNumber: currentDay.dayNumber,
    });
    const baseline: BaselineTemperature | null = baselineResult.success
      ? baselineResult.value
      : null;

    // PASO 4 — ¿Se cumplió la regla del triple térmico en este ciclo?
    const thermicRuleDay = this.findTripleShiftConfirmDay(
      allDaysInCycle,
      baseline,
      currentDay.dayNumber
    );

    // PASO 5 — Peak Day.
    const { peakDayNumber } = this.detectPeak.execute({
      daysInCycle: allDaysInCycle,
    });

    // PASO 6 — Regla del moco (3 días post-Peak).
    const mucusRuleDay =
      peakDayNumber !== null ? peakDayNumber + STM.POST_PEAK_DAYS : null;
    const mucusRuleMet =
      mucusRuleDay !== null && currentDay.dayNumber > mucusRuleDay;

    // PASO 7 — Determinar la fase.
    if (thermicRuleDay !== null && mucusRuleMet && mucusRuleDay !== null) {
      const confirmedFromDay = Math.max(thermicRuleDay, mucusRuleDay) + 1;
      if (currentDay.dayNumber >= confirmedFromDay) {
        return this.build('post_ovulatory_infertile', 'confirmed', false, {
          thermicRuleDay,
          mucusRuleDay,
        });
      }
      return this.build('post_ovulatory_waiting', 'probable', true, {
        thermicRuleDay,
        mucusRuleDay,
      });
    }

    const ruleDays = {
      ...(thermicRuleDay !== null ? { thermicRuleDay } : {}),
      ...(mucusRuleDay !== null ? { mucusRuleDay } : {}),
    };

    if (
      currentDay.isPeakDay ||
      PEAK_MUCUS_TYPES.includes(currentDay.mucusType)
    ) {
      return this.build('peak_phase', 'probable', true, ruleDays);
    }

    if (FERTILE_MUCUS_TYPES.includes(currentDay.mucusType)) {
      return this.build('fertile_building', 'probable', true, ruleDays);
    }

    if (currentDay.mucusType === 'none' && thermicRuleDay === null) {
      return this.build('dry_pre_ovulatory', 'probable', false, ruleDays);
    }

    return this.build('post_ovulatory_waiting', 'insufficient', true, ruleDays);
  }

  /**
   * Devuelve el dayNumber del 3er día del triple térmico (día en que la regla
   * queda CONFIRMADA), o `null`. Requiere `CONSECUTIVE_HIGH_DAYS` temperaturas
   * consecutivas (entre las válidas) ≥ LDC+0.2, la última ≥ LDC+0.4.
   * Los días sin temperatura no rompen la racha (STM-010); la fiebre se excluye
   * (STM-008).
   */
  private findTripleShiftConfirmDay(
    allDays: readonly CycleDay[],
    baseline: BaselineTemperature | null,
    asOfDayNumber: number
  ): number | null {
    if (baseline === null) return null;

    const highThreshold = baseline.coverline + STM.TEMP_RISE_THRESHOLD;
    const confirmedThreshold =
      baseline.coverline + STM.TEMP_CONFIRMED_THRESHOLD;

    const valid: ValidTemp[] = allDays
      .filter(
        (d): d is CycleDay & { basalTemp: number } =>
          d.basalTemp !== undefined &&
          d.basalTemp >= STM.MIN_BASAL_TEMP_C &&
          d.basalTemp <= STM.MAX_BASAL_TEMP_C &&
          d.dayNumber <= asOfDayNumber
      )
      .map((d) => ({ dayNumber: d.dayNumber, temp: d.basalTemp }))
      .sort((a, b) => a.dayNumber - b.dayNumber);

    const need = STM.CONSECUTIVE_HIGH_DAYS;
    for (let start = 0; start + need <= valid.length; start += 1) {
      const window = valid.slice(start, start + need);
      const last = window[need - 1];
      if (last === undefined) continue;
      const allHigh = window.every((w) => w.temp >= highThreshold);
      if (allHigh && last.temp >= confirmedThreshold) {
        return last.dayNumber;
      }
    }
    return null;
  }

  private build(
    phase: FertilityPhase,
    confidence: ConfidenceLevel,
    isFertileWindow: boolean,
    ruleDays?: { thermicRuleDay?: number; mucusRuleDay?: number }
  ): FertilityStatus {
    const copy = COPY[phase];
    return {
      phase,
      confidence,
      isFertileWindow,
      message: copy.message,
      detail: copy.detail,
      ...(ruleDays?.thermicRuleDay !== undefined
        ? { thermicRuleDay: ruleDays.thermicRuleDay }
        : {}),
      ...(ruleDays?.mucusRuleDay !== undefined
        ? { mucusRuleDay: ruleDays.mucusRuleDay }
        : {}),
    };
  }
}
