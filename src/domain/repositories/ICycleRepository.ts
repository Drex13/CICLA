// src/domain/repositories/ICycleRepository.ts
// Contrato abstracto para la persistencia de ciclos. Diseñado por nosotros
// (sin contrato en el documento) siguiendo el estilo de ICycleDayRepository.

import type { Observable } from 'rxjs';
import type { Cycle } from '@domain/entities/Cycle';
import type { Result } from '@shared/types/common';

/** Payload de creación: el repo asigna id y timestamps. */
export type CycleDraft = Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>;

/** Campos actualizables de un ciclo ya existente. */
export type CyclePatch = Partial<Pick<Cycle, 'endDate' | 'isActive'>>;

export interface ICycleRepository {
  /** El ciclo activo, o `null` si aún no se ha iniciado ninguno. */
  findActive(): Promise<Result<Cycle | null>>;

  /** Un ciclo por id. `null` si no existe. */
  findById(id: string): Promise<Result<Cycle | null>>;

  /** Todos los ciclos, más reciente primero. */
  findAll(): Promise<Result<Cycle[]>>;

  /** Crea un ciclo nuevo. */
  save(draft: CycleDraft): Promise<Result<Cycle>>;

  /** Actualiza endDate / isActive de un ciclo existente. */
  update(id: string, patch: CyclePatch): Promise<Result<Cycle>>;

  /** Observa reactivamente el ciclo activo. */
  observeActive(): Observable<Cycle | null>;
}
