// src/domain/usecases/LogDailyEntryUseCase.ts
// Valida y persiste el registro de un día. NO calcula fertilidad (eso es otro
// UseCase). Orquesta: obtiene el ciclo activo, deriva dayNumber y delega el
// upsert al repositorio. Retorna Result (regla R05).

import type {
  BleedingLevel,
  CervixPosition,
  CycleDay,
} from '@domain/entities/CycleDay';
import type { CervicalMucus } from '@domain/entities/CervicalMucus';
import type { DomainError } from '@domain/entities/DomainError';
import { domainError, validationError } from '@domain/entities/DomainError';
import type {
  CycleDayDraft,
  ICycleDayRepository,
} from '@domain/repositories/ICycleDayRepository';
import type { ICycleRepository } from '@domain/repositories/ICycleRepository';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';
import { STM } from '@shared/constants/stmConstants';
import { daysBetweenCivil, startOfCivilDay } from '@shared/utils/dateUtils';

export interface LogDailyEntryInput {
  readonly date: Date;
  readonly basalTemp?: number;
  readonly mucusType: CervicalMucus;
  readonly bleedingLevel?: BleedingLevel;
  readonly cervixPosition?: CervixPosition;
  readonly isPeakDay: boolean;
  readonly notes: string;
}

export interface ILogDailyEntryUseCase {
  execute(input: LogDailyEntryInput): Promise<Result<CycleDay>>;
}

export class LogDailyEntryUseCase implements ILogDailyEntryUseCase {
  constructor(
    private readonly cycleRepository: ICycleRepository,
    private readonly cycleDayRepository: ICycleDayRepository
  ) {}

  async execute(input: LogDailyEntryInput): Promise<Result<CycleDay>> {
    // 1. Validar temperatura contra el rango fisiológico absoluto.
    if (input.basalTemp !== undefined) {
      const t = input.basalTemp;
      if (
        Number.isNaN(t) ||
        t < STM.ABSOLUTE_MIN_BASAL_TEMP_C ||
        t > STM.ABSOLUTE_MAX_BASAL_TEMP_C
      ) {
        return err(
          domainError(
            'TEMPERATURE_OUT_OF_RANGE',
            `Temperatura fuera del rango fisiológico (${STM.ABSOLUTE_MIN_BASAL_TEMP_C}–${STM.ABSOLUTE_MAX_BASAL_TEMP_C} °C).`,
            { basalTemp: t }
          )
        );
      }
    }

    // 2. Necesitamos un ciclo activo para ubicar el día.
    const activeResult = await this.cycleRepository.findActive();
    if (!activeResult.success) return err(activeResult.error);
    const activeCycle = activeResult.value;
    if (activeCycle === null) {
      return err(
        domainError(
          'NO_ACTIVE_CYCLE',
          'No hay un ciclo activo. Inicia un ciclo antes de registrar días.'
        )
      );
    }

    // 3. Derivar el número de día dentro del ciclo.
    const dayOffset = daysBetweenCivil(activeCycle.startDate, input.date);
    if (dayOffset < 0) {
      return err(
        validationError('La fecha es anterior al inicio del ciclo activo.', {
          cycleStartDate: startOfCivilDay(activeCycle.startDate).toISOString(),
          date: startOfCivilDay(input.date).toISOString(),
        })
      );
    }
    const dayNumber = dayOffset + 1;

    // 4. Construir el draft omitiendo claves opcionales ausentes
    //    (exactOptionalPropertyTypes).
    const draft: CycleDayDraft = {
      cycleId: activeCycle.id,
      date: startOfCivilDay(input.date),
      dayNumber,
      mucusType: input.mucusType,
      isPeakDay: input.isPeakDay,
      notes: input.notes,
      ...(input.basalTemp !== undefined ? { basalTemp: input.basalTemp } : {}),
      ...(input.bleedingLevel !== undefined
        ? { bleedingLevel: input.bleedingLevel }
        : {}),
      ...(input.cervixPosition !== undefined
        ? { cervixPosition: input.cervixPosition }
        : {}),
    };

    // 5. Delegar el upsert.
    const saved = await this.cycleDayRepository.save(draft);
    if (!saved.success) return err<DomainError>(saved.error);
    return ok(saved.value);
  }
}
