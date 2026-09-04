// src/domain/usecases/AnalyzeCurrentCycleUseCase.ts
// Ejecuta el análisis STM del ciclo activo y devuelve lo que necesitan tanto la
// pantalla de inicio como la gráfica: estado de fertilidad + LDC + Peak Day.
// Orquestación pura sobre repos + UseCases del núcleo (no añade reglas nuevas).

import type { CycleDay } from '@domain/entities/CycleDay';
import type { FertilityStatus } from '@domain/entities/FertilityStatus';
import type { ICycleDayRepository } from '@domain/repositories/ICycleDayRepository';
import type { ICycleRepository } from '@domain/repositories/ICycleRepository';
import {
  CalculateFertilityStatusUseCase,
  type ICalculateFertilityStatusUseCase,
} from '@domain/usecases/CalculateFertilityStatusUseCase';
import {
  DetermineBaselineTemperatureUseCase,
  type BaselineTemperature,
  type IDetermineBaselineTemperatureUseCase,
} from '@domain/usecases/DetermineBaselineTemperatureUseCase';
import {
  DetectPeakDayUseCase,
  type IDetectPeakDayUseCase,
} from '@domain/usecases/DetectPeakDayUseCase';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';
import { isSameCivilDay } from '@shared/utils/dateUtils';

export interface CurrentCycleAnalysis {
  readonly status: FertilityStatus | null; // null si no hay ciclo/días que evaluar
  readonly baseline: BaselineTemperature | null;
  readonly peakDayNumber: number | null;
  /** Día evaluado (el de hoy, o el último registrado si hoy no tiene registro). */
  readonly evaluatedDayNumber: number | null;
}

export interface AnalyzeCurrentCycleInput {
  readonly today?: Date;
}

export interface IAnalyzeCurrentCycleUseCase {
  execute(
    input?: AnalyzeCurrentCycleInput
  ): Promise<Result<CurrentCycleAnalysis>>;
}

const EMPTY: CurrentCycleAnalysis = {
  status: null,
  baseline: null,
  peakDayNumber: null,
  evaluatedDayNumber: null,
};

export class AnalyzeCurrentCycleUseCase implements IAnalyzeCurrentCycleUseCase {
  private readonly calculate: ICalculateFertilityStatusUseCase;
  private readonly determineBaseline: IDetermineBaselineTemperatureUseCase;
  private readonly detectPeak: IDetectPeakDayUseCase;

  constructor(
    private readonly cycleRepository: ICycleRepository,
    private readonly cycleDayRepository: ICycleDayRepository,
    deps?: {
      calculate?: ICalculateFertilityStatusUseCase;
      determineBaseline?: IDetermineBaselineTemperatureUseCase;
      detectPeak?: IDetectPeakDayUseCase;
    }
  ) {
    this.calculate = deps?.calculate ?? new CalculateFertilityStatusUseCase();
    this.determineBaseline =
      deps?.determineBaseline ?? new DetermineBaselineTemperatureUseCase();
    this.detectPeak = deps?.detectPeak ?? new DetectPeakDayUseCase();
  }

  async execute(
    input: AnalyzeCurrentCycleInput = {}
  ): Promise<Result<CurrentCycleAnalysis>> {
    const today = input.today ?? new Date();

    const activeResult = await this.cycleRepository.findActive();
    if (!activeResult.success) return err(activeResult.error);
    const cycle = activeResult.value;
    if (cycle === null) return ok(EMPTY);

    const daysResult = await this.cycleDayRepository.findByCycleId(cycle.id);
    if (!daysResult.success) return err(daysResult.error);
    const daysInCycle = daysResult.value;
    if (daysInCycle.length === 0) return ok(EMPTY);

    const currentDay: CycleDay =
      daysInCycle.find((d) => isSameCivilDay(d.date, today)) ??
      (daysInCycle[daysInCycle.length - 1] as CycleDay);

    // Ciclos previos (para el conteo de datos suficientes y el histórico de LDC).
    const allCyclesResult = await this.cycleRepository.findAll();
    if (!allCyclesResult.success) return err(allCyclesResult.error);
    const previousCycles: CycleDay[][] = [];
    for (const previous of allCyclesResult.value) {
      if (previous.id === cycle.id) continue;
      const pDays = await this.cycleDayRepository.findByCycleId(previous.id);
      if (!pDays.success) return err(pDays.error);
      previousCycles.push([...pDays.value]);
    }

    const baselineResult = this.determineBaseline.execute({
      daysInCycle,
      asOfDayNumber: currentDay.dayNumber,
    });
    const { peakDayNumber } = this.detectPeak.execute({ daysInCycle });

    const status = this.calculate.execute({
      currentDay,
      allDaysInCycle: daysInCycle,
      previousCycles,
    });

    return ok({
      status,
      baseline: baselineResult.success ? baselineResult.value : null,
      peakDayNumber,
      evaluatedDayNumber: currentDay.dayNumber,
    });
  }
}
