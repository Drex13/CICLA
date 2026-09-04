// src/data/repositories/DrizzleCycleDayRepository.ts
// Implementación concreta de ICycleDayRepository sobre Drizzle + SQLite.
// Traduce con CycleDayMapper y reporta fallos como Result (regla R05).

import { asc, desc, eq } from 'drizzle-orm';
import { Observable } from 'rxjs';
import { cycleDays, type AppDatabase } from '@data/database/schema';
import type { DatabaseChangeBus } from '@data/database/changeBus';
import { CycleDayMapper } from '@data/mappers/CycleDayMapper';
import type { CycleDay } from '@domain/entities/CycleDay';
import { persistenceError } from '@domain/entities/DomainError';
import type {
  CycleDayDraft,
  ICycleDayRepository,
} from '@domain/repositories/ICycleDayRepository';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';
import { civilDayKey } from '@shared/utils/dateUtils';

export type IdGenerator = () => string;

export const defaultIdGenerator: IdGenerator = () => {
  const maybeCrypto = (globalThis as { crypto?: { randomUUID?: () => string } })
    .crypto;
  if (maybeCrypto?.randomUUID) return maybeCrypto.randomUUID();
  // Fallback no criptográfico: la app inyecta expo-crypto en el wiring.
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export class DrizzleCycleDayRepository implements ICycleDayRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly changeBus: DatabaseChangeBus,
    private readonly generateId: IdGenerator = defaultIdGenerator
  ) {}

  async findByDate(date: Date): Promise<Result<CycleDay | null>> {
    try {
      const rows = await this.db
        .select()
        .from(cycleDays)
        .where(eq(cycleDays.date, civilDayKey(date)))
        .limit(1);
      const row = rows[0];
      return ok(row ? CycleDayMapper.toDomain(row) : null);
    } catch (error) {
      return err(
        persistenceError('findByDate falló', { cause: String(error) })
      );
    }
  }

  async findByCycleId(cycleId: string): Promise<Result<CycleDay[]>> {
    try {
      const rows = await this.db
        .select()
        .from(cycleDays)
        .where(eq(cycleDays.cycleId, cycleId))
        .orderBy(asc(cycleDays.dayNumber));
      return ok(rows.map(CycleDayMapper.toDomain));
    } catch (error) {
      return err(
        persistenceError('findByCycleId falló', { cause: String(error) })
      );
    }
  }

  async save(draft: CycleDayDraft): Promise<Result<CycleDay>> {
    try {
      const dateTs = civilDayKey(draft.date);
      const now = new Date();

      const existing = await this.db
        .select()
        .from(cycleDays)
        .where(eq(cycleDays.date, dateTs))
        .limit(1);
      const previous = existing[0];

      const full = CycleDayMapper.toPersistence(draft, {
        id: previous?.id ?? this.generateId(),
        createdAt: previous ? new Date(previous.createdAt) : now,
        updatedAt: now,
      });

      if (previous) {
        await this.db
          .update(cycleDays)
          .set({
            cycleId: full.cycleId,
            date: full.date,
            dayNumber: full.dayNumber,
            basalTemp: full.basalTemp,
            mucusType: full.mucusType,
            bleedingLevel: full.bleedingLevel,
            cervixHeight: full.cervixHeight,
            cervixOpening: full.cervixOpening,
            cervixFirmness: full.cervixFirmness,
            isPeakDay: full.isPeakDay,
            notes: full.notes,
            updatedAt: full.updatedAt,
          })
          .where(eq(cycleDays.id, previous.id));
      } else {
        await this.db.insert(cycleDays).values(full);
      }

      const savedRows = await this.db
        .select()
        .from(cycleDays)
        .where(eq(cycleDays.date, dateTs))
        .limit(1);
      const saved = savedRows[0];
      if (!saved) {
        return err(persistenceError('El día no se pudo releer tras guardar'));
      }

      this.changeBus.emit();
      return ok(CycleDayMapper.toDomain(saved));
    } catch (error) {
      return err(persistenceError('save falló', { cause: String(error) }));
    }
  }

  async findLastN(n: number): Promise<Result<CycleDay[]>> {
    try {
      const rows = await this.db
        .select()
        .from(cycleDays)
        .orderBy(desc(cycleDays.date))
        .limit(n);
      return ok(rows.map(CycleDayMapper.toDomain));
    } catch (error) {
      return err(persistenceError('findLastN falló', { cause: String(error) }));
    }
  }

  observeByCycleId(cycleId: string): Observable<CycleDay[]> {
    return new Observable<CycleDay[]>((subscriber) => {
      const push = (): void => {
        this.findByCycleId(cycleId).then(
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
