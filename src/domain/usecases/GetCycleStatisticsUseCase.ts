// src/domain/usecases/GetCycleStatisticsUseCase.ts
// Estadísticas agregadas del historial de ciclos: longitud media/mín/máx y
// duración media de la fase lútea (del cambio térmico al fin del ciclo).
// Pura y síncrona. Solo cuenta ciclos COMPLETOS (con endDate) para longitudes.

import type { Cycle } from '@domain/entities/Cycle';
import { cycleLengthInDays } from '@domain/entities/Cycle';
import type { CycleDay } from '@domain/entities/CycleDay';
import {
  DetermineBaselineTemperatureUseCase,
  type IDetermineBaselineTemperatureUseCase,
} from '@domain/usecases/DetermineBaselineTemperatureUseCase';
import type { Result } from '@shared/types/common';
import { ok } from '@shared/types/common';

export interface CycleStatistics {
  readonly totalCycles: number;
  readonly completedCycles: number;
  readonly averageCycleLength: number | null;
  readonly shortestCycleLength: number | null;
  readonly longestCycleLength: number | null;
  readonly averageLutealPhaseLength: number | null;
}

export interface GetCycleStatisticsInput {
  readonly cycles: readonly Cycle[];
  /** Días registrados por ciclo, indexados por `cycle.id`. */
  readonly daysByCycleId: Readonly<Record<string, readonly CycleDay[]>>;
}

export interface IGetCycleStatisticsUseCase {
  execute(input: GetCycleStatisticsInput): Result<CycleStatistics>;
}

const average = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) /
      10;

export class GetCycleStatisticsUseCase implements IGetCycleStatisticsUseCase {
  private readonly determineBaseline: IDetermineBaselineTemperatureUseCase;

  constructor(deps?: {
    determineBaseline?: IDetermineBaselineTemperatureUseCase;
  }) {
    this.determineBaseline =
      deps?.determineBaseline ?? new DetermineBaselineTemperatureUseCase();
  }

  execute(input: GetCycleStatisticsInput): Result<CycleStatistics> {
    const { cycles, daysByCycleId } = input;

    const completed = cycles.filter((c) => c.endDate !== undefined);
    const lengths = completed
      .map(cycleLengthInDays)
      .filter((n): n is number => n !== null);

    const lutealLengths: number[] = [];
    for (const cycle of completed) {
      const length = cycleLengthInDays(cycle);
      if (length === null) continue;
      const days = daysByCycleId[cycle.id] ?? [];
      const baseline = this.determineBaseline.execute({ daysInCycle: days });
      if (
        baseline.success &&
        baseline.value.thermalShiftStartDayNumber !== null
      ) {
        lutealLengths.push(
          length - baseline.value.thermalShiftStartDayNumber + 1
        );
      }
    }

    return ok({
      totalCycles: cycles.length,
      completedCycles: completed.length,
      averageCycleLength: average(lengths),
      shortestCycleLength: lengths.length ? Math.min(...lengths) : null,
      longestCycleLength: lengths.length ? Math.max(...lengths) : null,
      averageLutealPhaseLength: average(lutealLengths),
    });
  }
}
