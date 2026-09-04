// src/domain/repositories/ICycleDayRepository.ts
// Contrato abstracto. Solo tipos: la implementación concreta vive en @data.
// `Observable` se importa SOLO como tipo desde rxjs (decisión acordada: la
// reactividad de WatermelonDB se expresa aquí sin acoplar el dominio a la lib).

import type { Observable } from 'rxjs';
import type { CycleDay } from '@domain/entities/CycleDay';
import type { Result } from '@shared/types/common';

/** Payload de escritura: el repo asigna id y timestamps. */
export type CycleDayDraft = Omit<CycleDay, 'id' | 'createdAt' | 'updatedAt'>;

export interface ICycleDayRepository {
  /** Un día concreto por fecha (día civil). `null` si no hay registro. */
  findByDate(date: Date): Promise<Result<CycleDay | null>>;

  /** Todos los días de un ciclo, ordenados por dayNumber ascendente. */
  findByCycleId(cycleId: string): Promise<Result<CycleDay[]>>;

  /** Crea o actualiza el día de esa fecha (upsert). */
  save(draft: CycleDayDraft): Promise<Result<CycleDay>>;

  /** Últimos N días registrados globalmente, más reciente primero. */
  findLastN(n: number): Promise<Result<CycleDay[]>>;

  /** Observa reactivamente los días de un ciclo (WatermelonDB observable). */
  observeByCycleId(cycleId: string): Observable<CycleDay[]>;
}
