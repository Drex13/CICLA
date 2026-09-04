// __tests__/helpers/fakeRepositories.ts
// Implementaciones en memoria de los contratos del dominio, para tests de
// UseCases que orquestan persistencia (LogDailyEntry, StartNewCycle).

import { of, type Observable } from 'rxjs';
import type { Cycle } from '@domain/entities/Cycle';
import type { CycleDay } from '@domain/entities/CycleDay';
import type {
  CycleDayDraft,
  ICycleDayRepository,
} from '@domain/repositories/ICycleDayRepository';
import type {
  CycleDraft,
  CyclePatch,
  ICycleRepository,
} from '@domain/repositories/ICycleRepository';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';
import { notFoundError } from '@domain/entities/DomainError';
import { isSameCivilDay } from '@shared/utils/dateUtils';

let seq = 0;
const nextId = (prefix: string): string => {
  seq += 1;
  return `${prefix}-${seq}`;
};

export class FakeCycleRepository implements ICycleRepository {
  readonly cycles: Cycle[] = [];

  constructor(initial: Cycle[] = []) {
    this.cycles.push(...initial);
  }

  async findActive(): Promise<Result<Cycle | null>> {
    return ok(this.cycles.find((c) => c.isActive) ?? null);
  }

  async findById(id: string): Promise<Result<Cycle | null>> {
    return ok(this.cycles.find((c) => c.id === id) ?? null);
  }

  async findAll(): Promise<Result<Cycle[]>> {
    return ok(
      [...this.cycles].sort(
        (a, b) => b.startDate.getTime() - a.startDate.getTime()
      )
    );
  }

  async save(draft: CycleDraft): Promise<Result<Cycle>> {
    const now = new Date();
    const cycle: Cycle = {
      id: nextId('cycle'),
      startDate: draft.startDate,
      isActive: draft.isActive,
      createdAt: now,
      updatedAt: now,
      ...(draft.endDate !== undefined ? { endDate: draft.endDate } : {}),
    };
    this.cycles.push(cycle);
    return ok(cycle);
  }

  async update(id: string, patch: CyclePatch): Promise<Result<Cycle>> {
    const idx = this.cycles.findIndex((c) => c.id === id);
    if (idx === -1) return err(notFoundError(`Ciclo ${id} no existe`));
    const current = this.cycles[idx] as Cycle;
    const updated: Cycle = {
      ...current,
      ...('isActive' in patch && patch.isActive !== undefined
        ? { isActive: patch.isActive }
        : {}),
      ...('endDate' in patch && patch.endDate !== undefined
        ? { endDate: patch.endDate }
        : {}),
      updatedAt: new Date(),
    };
    this.cycles[idx] = updated;
    return ok(updated);
  }

  observeActive(): Observable<Cycle | null> {
    return of(this.cycles.find((c) => c.isActive) ?? null);
  }
}

export class FakeCycleDayRepository implements ICycleDayRepository {
  readonly days: CycleDay[] = [];

  constructor(initial: CycleDay[] = []) {
    this.days.push(...initial);
  }

  async findByDate(date: Date): Promise<Result<CycleDay | null>> {
    return ok(this.days.find((d) => isSameCivilDay(d.date, date)) ?? null);
  }

  async findByCycleId(cycleId: string): Promise<Result<CycleDay[]>> {
    return ok(
      this.days
        .filter((d) => d.cycleId === cycleId)
        .sort((a, b) => a.dayNumber - b.dayNumber)
    );
  }

  async save(draft: CycleDayDraft): Promise<Result<CycleDay>> {
    const now = new Date();
    const existingIdx = this.days.findIndex((d) =>
      isSameCivilDay(d.date, draft.date)
    );
    if (existingIdx !== -1) {
      const prev = this.days[existingIdx] as CycleDay;
      const updated: CycleDay = {
        ...prev,
        ...draft,
        id: prev.id,
        createdAt: prev.createdAt,
        updatedAt: now,
      };
      this.days[existingIdx] = updated;
      return ok(updated);
    }
    const created: CycleDay = {
      id: nextId('day'),
      createdAt: now,
      updatedAt: now,
      ...draft,
    };
    this.days.push(created);
    return ok(created);
  }

  async findLastN(n: number): Promise<Result<CycleDay[]>> {
    return ok(
      [...this.days]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, n)
    );
  }

  observeByCycleId(cycleId: string): Observable<CycleDay[]> {
    return of(this.days.filter((d) => d.cycleId === cycleId));
  }
}
