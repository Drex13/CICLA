// __tests__/data/DrizzleCycleDayRepository.test.ts
// Integración: DrizzleCycleDayRepository contra SQLite real en memoria.
// Flujo del doc §11.1 / §13-paso-20: save → findByDate → toDomain.

import { DrizzleCycleDayRepository } from '@data/repositories/DrizzleCycleDayRepository';
import { DrizzleCycleRepository } from '@data/repositories/DrizzleCycleRepository';
import type { CycleDayDraft } from '@domain/repositories/ICycleDayRepository';
import { makeTestDatabase, sequentialIds } from '../helpers/testDatabase';

const setup = async () => {
  const { db, changeBus } = await makeTestDatabase();
  const cycleRepo = new DrizzleCycleRepository(db, changeBus, sequentialIds());
  const cycleResult = await cycleRepo.save({
    startDate: new Date(2026, 4, 1),
    isActive: true,
  });
  if (!cycleResult.success) throw new Error('setup: no se pudo crear el ciclo');
  const dayRepo = new DrizzleCycleDayRepository(db, changeBus, sequentialIds());
  return { dayRepo, cycleId: cycleResult.value.id };
};

const draft = (over: Partial<CycleDayDraft>): CycleDayDraft => ({
  cycleId: 'c1',
  date: new Date(2026, 4, 12),
  dayNumber: 12,
  mucusType: 'creamy',
  isPeakDay: false,
  notes: '',
  ...over,
});

describe('DrizzleCycleDayRepository (integración)', () => {
  it('save → findByDate → toDomain: roundtrip completo de tipos', async () => {
    const { dayRepo, cycleId } = await setup();
    const date = new Date(2026, 4, 12, 15, 30); // con hora: debe normalizarse a día civil

    const saved = await dayRepo.save(
      draft({ cycleId, date, basalTemp: 36.55, mucusType: 'egg_white' })
    );
    expect(saved.success).toBe(true);
    if (!saved.success) return;

    const found = await dayRepo.findByDate(new Date(2026, 4, 12));
    expect(found.success).toBe(true);
    if (!found.success || found.value === null)
      throw new Error('no encontrado');

    expect(found.value.id).toBe(saved.value.id);
    expect(found.value.cycleId).toBe(cycleId);
    expect(found.value.date).toBeInstanceOf(Date);
    expect(found.value.basalTemp).toBe(36.55);
    expect(found.value.mucusType).toBe('egg_white');
    expect(found.value.createdAt).toBeInstanceOf(Date);
  });

  it('los campos opcionales ausentes vuelven como ausentes (no null)', async () => {
    const { dayRepo, cycleId } = await setup();
    const saved = await dayRepo.save(
      draft({ cycleId, date: new Date(2026, 4, 6), dayNumber: 6 })
    );
    if (!saved.success) throw new Error('save');
    expect('basalTemp' in saved.value).toBe(false);
    expect('bleedingLevel' in saved.value).toBe(false);
    expect('cervixPosition' in saved.value).toBe(false);
  });

  it('persiste y reconstruye cervixPosition (3 columnas ↔ objeto)', async () => {
    const { dayRepo, cycleId } = await setup();
    const saved = await dayRepo.save(
      draft({
        cycleId,
        date: new Date(2026, 4, 10),
        dayNumber: 10,
        cervixPosition: { height: 'high', opening: 'open', firmness: 'soft' },
      })
    );
    if (!saved.success) throw new Error('save');
    expect(saved.value.cervixPosition).toEqual({
      height: 'high',
      opening: 'open',
      firmness: 'soft',
    });
  });

  it('un segundo save en la misma fecha actualiza, no duplica', async () => {
    const { dayRepo, cycleId } = await setup();
    const date = new Date(2026, 4, 12);
    const first = await dayRepo.save(draft({ cycleId, date, basalTemp: 36.5 }));
    if (!first.success) throw new Error('save');

    const second = await dayRepo.save(
      draft({ cycleId, date, basalTemp: 36.7, mucusType: 'watery' })
    );
    expect(second.success).toBe(true);
    if (!second.success) return;
    expect(second.value.id).toBe(first.value.id);
    expect(second.value.basalTemp).toBe(36.7);

    const all = await dayRepo.findByCycleId(cycleId);
    expect(all.success && all.value).toHaveLength(1);
  });

  it('actualizar un día borrando la temperatura la deja ausente', async () => {
    const { dayRepo, cycleId } = await setup();
    const date = new Date(2026, 4, 12);
    await dayRepo.save(draft({ cycleId, date, basalTemp: 36.5 }));
    const cleared = await dayRepo.save(draft({ cycleId, date })); // sin basalTemp
    if (!cleared.success) throw new Error('save');
    expect('basalTemp' in cleared.value).toBe(false);
  });

  it('findByCycleId ordena por dayNumber; findLastN por fecha desc', async () => {
    const { dayRepo, cycleId } = await setup();
    await dayRepo.save(
      draft({ cycleId, date: new Date(2026, 4, 3), dayNumber: 3 })
    );
    await dayRepo.save(
      draft({ cycleId, date: new Date(2026, 4, 1), dayNumber: 1 })
    );
    await dayRepo.save(
      draft({ cycleId, date: new Date(2026, 4, 2), dayNumber: 2 })
    );

    const byCycle = await dayRepo.findByCycleId(cycleId);
    if (!byCycle.success) throw new Error('findByCycleId');
    expect(byCycle.value.map((d) => d.dayNumber)).toEqual([1, 2, 3]);

    const last2 = await dayRepo.findLastN(2);
    if (!last2.success) throw new Error('findLastN');
    expect(last2.value.map((d) => d.dayNumber)).toEqual([3, 2]);
  });

  it('observeByCycleId re-emite tras cada save', async () => {
    const { dayRepo, cycleId } = await setup();
    const counts: number[] = [];
    const sub = dayRepo
      .observeByCycleId(cycleId)
      .subscribe((days) => counts.push(days.length));

    await dayRepo.save(
      draft({ cycleId, date: new Date(2026, 4, 1), dayNumber: 1 })
    );
    await dayRepo.save(
      draft({ cycleId, date: new Date(2026, 4, 2), dayNumber: 2 })
    );
    await new Promise((r) => setTimeout(r, 0));
    sub.unsubscribe();

    expect(counts[0]).toBe(0);
    expect(counts[counts.length - 1]).toBe(2);
  });
});
