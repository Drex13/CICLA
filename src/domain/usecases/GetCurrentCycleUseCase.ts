// src/domain/usecases/GetCurrentCycleUseCase.ts
// Carga el ciclo activo, sus días y el registro de hoy. Solo orquestación de
// repositorios (regla R04: una responsabilidad). El doc §6.1 lo nombra como
// dependencia del cycleStore; no tenía contrato escrito, se diseña aquí.

import type { Cycle } from '@domain/entities/Cycle';
import type { CycleDay } from '@domain/entities/CycleDay';
import type { ICycleDayRepository } from '@domain/repositories/ICycleDayRepository';
import type { ICycleRepository } from '@domain/repositories/ICycleRepository';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';
import { isSameCivilDay } from '@shared/utils/dateUtils';

export interface CurrentCycleSnapshot {
  readonly cycle: Cycle | null;
  readonly daysInCycle: readonly CycleDay[];
  readonly todayEntry: CycleDay | null;
}

export interface GetCurrentCycleInput {
  /** Fecha considerada "hoy" (inyectable para tests). Por defecto: ahora. */
  readonly today?: Date;
}

export interface IGetCurrentCycleUseCase {
  execute(input?: GetCurrentCycleInput): Promise<Result<CurrentCycleSnapshot>>;
}

const EMPTY: CurrentCycleSnapshot = {
  cycle: null,
  daysInCycle: [],
  todayEntry: null,
};

export class GetCurrentCycleUseCase implements IGetCurrentCycleUseCase {
  constructor(
    private readonly cycleRepository: ICycleRepository,
    private readonly cycleDayRepository: ICycleDayRepository
  ) {}

  async execute(
    input: GetCurrentCycleInput = {}
  ): Promise<Result<CurrentCycleSnapshot>> {
    const today = input.today ?? new Date();

    const activeResult = await this.cycleRepository.findActive();
    if (!activeResult.success) return err(activeResult.error);
    const cycle = activeResult.value;
    if (cycle === null) return ok(EMPTY);

    const daysResult = await this.cycleDayRepository.findByCycleId(cycle.id);
    if (!daysResult.success) return err(daysResult.error);
    const daysInCycle = daysResult.value;

    const todayEntry =
      daysInCycle.find((d) => isSameCivilDay(d.date, today)) ?? null;

    return ok({ cycle, daysInCycle, todayEntry });
  }
}
