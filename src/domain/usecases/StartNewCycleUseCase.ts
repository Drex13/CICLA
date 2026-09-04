// src/domain/usecases/StartNewCycleUseCase.ts
// Inicia un ciclo nuevo (día 1 = primer día de regla). Cierra el ciclo activo
// anterior si lo hay. Aquí vive la regla de negocio "ciclo demasiado corto"
// que el documento (§6, ejemplo INCORRECTO) prohíbe poner en el store.

import type { Cycle } from '@domain/entities/Cycle';
import { domainError, validationError } from '@domain/entities/DomainError';
import type {
  CycleDraft,
  ICycleRepository,
} from '@domain/repositories/ICycleRepository';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';
import { STM } from '@shared/constants/stmConstants';
import {
  addCivilDays,
  daysBetweenCivil,
  startOfCivilDay,
} from '@shared/utils/dateUtils';

export interface StartNewCycleInput {
  readonly startDate: Date;
}

export interface StartNewCycleResult {
  readonly cycle: Cycle;
  /** `true` si la longitud del ciclo anterior quedó fuera del rango típico. */
  readonly previousCycleAtypicalLength: boolean;
}

export interface IStartNewCycleUseCase {
  execute(input: StartNewCycleInput): Promise<Result<StartNewCycleResult>>;
}

export class StartNewCycleUseCase implements IStartNewCycleUseCase {
  constructor(private readonly cycleRepository: ICycleRepository) {}

  async execute(
    input: StartNewCycleInput
  ): Promise<Result<StartNewCycleResult>> {
    const start = startOfCivilDay(input.startDate);

    // 1. No se puede iniciar un ciclo en el futuro.
    if (daysBetweenCivil(new Date(), start) > 0) {
      return err(
        validationError('La fecha de inicio no puede estar en el futuro.', {
          startDate: start.toISOString(),
        })
      );
    }

    // 2. Revisar el ciclo activo actual.
    const activeResult = await this.cycleRepository.findActive();
    if (!activeResult.success) return err(activeResult.error);
    const activeCycle = activeResult.value;

    let previousCycleAtypicalLength = false;

    if (activeCycle !== null) {
      const length = daysBetweenCivil(activeCycle.startDate, start);

      if (length <= 0) {
        return err(
          validationError(
            'La fecha de inicio debe ser posterior al inicio del ciclo activo.',
            { activeStartDate: activeCycle.startDate.toISOString() }
          )
        );
      }
      if (length < STM.MIN_CYCLE_LENGTH_DAYS) {
        return err(
          domainError(
            'CYCLE_TOO_SHORT',
            `El ciclo anterior tendría ${length} días; el mínimo típico es ${STM.MIN_CYCLE_LENGTH_DAYS}.`,
            { length, minimum: STM.MIN_CYCLE_LENGTH_DAYS }
          )
        );
      }
      previousCycleAtypicalLength = length > STM.MAX_CYCLE_LENGTH_DAYS;

      // 3. Cerrar el ciclo activo el día antes del nuevo inicio.
      const closeResult = await this.cycleRepository.update(activeCycle.id, {
        endDate: addCivilDays(start, -1),
        isActive: false,
      });
      if (!closeResult.success) return err(closeResult.error);
    }

    // 4. Crear el ciclo nuevo (activo). `endDate` se omite: el ciclo sigue abierto.
    const draft: CycleDraft = { startDate: start, isActive: true };
    const created = await this.cycleRepository.save(draft);
    if (!created.success) return err(created.error);

    return ok({ cycle: created.value, previousCycleAtypicalLength });
  }
}
