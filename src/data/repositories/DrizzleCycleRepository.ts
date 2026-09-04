// src/data/repositories/DrizzleCycleRepository.ts
// Implementación concreta de ICycleRepository sobre Drizzle + SQLite.

import { desc, eq } from 'drizzle-orm';
import { Observable } from 'rxjs';
import { cycles, type AppDatabase } from '@data/database/schema';
import type { DatabaseChangeBus } from '@data/database/changeBus';
import { CycleMapper } from '@data/mappers/CycleMapper';
import {
  defaultIdGenerator,
  type IdGenerator,
} from '@data/repositories/DrizzleCycleDayRepository';
import type { Cycle } from '@domain/entities/Cycle';
import { notFoundError, persistenceError } from '@domain/entities/DomainError';
import type {
  CycleDraft,
  CyclePatch,
  ICycleRepository,
} from '@domain/repositories/ICycleRepository';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';

export class DrizzleCycleRepository implements ICycleRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly changeBus: DatabaseChangeBus,
    private readonly generateId: IdGenerator = defaultIdGenerator
  ) {}

  async findActive(): Promise<Result<Cycle | null>> {
    try {
      const rows = await this.db
        .select()
        .from(cycles)
        .where(eq(cycles.isActive, true))
        .limit(1);
      const row = rows[0];
      return ok(row ? CycleMapper.toDomain(row) : null);
    } catch (error) {
      return err(
        persistenceError('findActive falló', { cause: String(error) })
      );
    }
  }

  async findById(id: string): Promise<Result<Cycle | null>> {
    try {
      const rows = await this.db
        .select()
        .from(cycles)
        .where(eq(cycles.id, id))
        .limit(1);
      const row = rows[0];
      return ok(row ? CycleMapper.toDomain(row) : null);
    } catch (error) {
      return err(persistenceError('findById falló', { cause: String(error) }));
    }
  }

  async findAll(): Promise<Result<Cycle[]>> {
    try {
      const rows = await this.db
        .select()
        .from(cycles)
        .orderBy(desc(cycles.startDate));
      return ok(rows.map(CycleMapper.toDomain));
    } catch (error) {
      return err(persistenceError('findAll falló', { cause: String(error) }));
    }
  }

  async save(draft: CycleDraft): Promise<Result<Cycle>> {
    try {
      const now = new Date();
      const id = this.generateId();
      const row = CycleMapper.toPersistence(draft, {
        id,
        createdAt: now,
        updatedAt: now,
      });
      await this.db.insert(cycles).values(row);

      const savedRows = await this.db
        .select()
        .from(cycles)
        .where(eq(cycles.id, id))
        .limit(1);
      const saved = savedRows[0];
      if (!saved) {
        return err(persistenceError('El ciclo no se pudo releer tras crear'));
      }

      this.changeBus.emit();
      return ok(CycleMapper.toDomain(saved));
    } catch (error) {
      return err(persistenceError('save falló', { cause: String(error) }));
    }
  }

  async update(id: string, patch: CyclePatch): Promise<Result<Cycle>> {
    try {
      const existingRows = await this.db
        .select()
        .from(cycles)
        .where(eq(cycles.id, id))
        .limit(1);
      if (!existingRows[0]) {
        return err(notFoundError(`El ciclo ${id} no existe`, { id }));
      }

      const changes: Partial<typeof cycles.$inferInsert> = {
        updatedAt: Date.now(),
      };
      if ('isActive' in patch && patch.isActive !== undefined) {
        changes.isActive = patch.isActive;
      }
      if ('endDate' in patch) {
        changes.endDate = patch.endDate ? patch.endDate.getTime() : null;
      }
      await this.db.update(cycles).set(changes).where(eq(cycles.id, id));

      const updatedRows = await this.db
        .select()
        .from(cycles)
        .where(eq(cycles.id, id))
        .limit(1);
      const updated = updatedRows[0];
      if (!updated) {
        return err(
          persistenceError('El ciclo no se pudo releer tras actualizar')
        );
      }

      this.changeBus.emit();
      return ok(CycleMapper.toDomain(updated));
    } catch (error) {
      return err(persistenceError('update falló', { cause: String(error) }));
    }
  }

  observeActive(): Observable<Cycle | null> {
    return new Observable<Cycle | null>((subscriber) => {
      const push = (): void => {
        this.findActive().then(
          (result) => {
            if (result.success) subscriber.next(result.value);
            else subscriber.error(result.error);
          },
          (reason) => subscriber.error(reason)
        );
      };
      push();
      return this.changeBus.subscribe(push);
    });
  }
}
