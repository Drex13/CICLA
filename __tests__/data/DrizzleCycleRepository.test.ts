// __tests__/data/DrizzleCycleRepository.test.ts
// Integración: DrizzleCycleRepository contra SQLite real en memoria.

import { DrizzleCycleRepository } from '@data/repositories/DrizzleCycleRepository';
import { makeTestDatabase, sequentialIds } from '../helpers/testDatabase';

const setup = async () => {
  const { db, changeBus } = await makeTestDatabase();
  return new DrizzleCycleRepository(db, changeBus, sequentialIds());
};

describe('DrizzleCycleRepository (integración)', () => {
  it('save → findActive devuelve el ciclo activo mapeado a entidad', async () => {
    const repo = await setup();
    const start = new Date(2026, 4, 1);

    const saved = await repo.save({ startDate: start, isActive: true });
    expect(saved.success).toBe(true);
    if (!saved.success) return;
    expect(saved.value.isActive).toBe(true);
    expect(saved.value.endDate).toBeUndefined();
    expect(saved.value.startDate).toBeInstanceOf(Date);
    expect(saved.value.startDate.getTime()).toBe(start.getTime());

    const active = await repo.findActive();
    expect(active.success).toBe(true);
    if (!active.success) return;
    expect(active.value?.id).toBe(saved.value.id);
  });

  it('update cierra el ciclo (endDate + isActive=false) y findActive pasa a null', async () => {
    const repo = await setup();
    const created = await repo.save({
      startDate: new Date(2026, 4, 1),
      isActive: true,
    });
    if (!created.success) throw new Error('setup');

    const end = new Date(2026, 4, 28);
    const closed = await repo.update(created.value.id, {
      endDate: end,
      isActive: false,
    });
    expect(closed.success).toBe(true);
    if (!closed.success) return;
    expect(closed.value.isActive).toBe(false);
    expect(closed.value.endDate?.getTime()).toBe(end.getTime());

    const active = await repo.findActive();
    expect(active.success && active.value).toBeNull();
  });

  it('update sobre un id inexistente → Result NOT_FOUND', async () => {
    const repo = await setup();
    const result = await repo.update('no-existe', { isActive: false });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('findAll ordena por startDate descendente', async () => {
    const repo = await setup();
    await repo.save({ startDate: new Date(2026, 0, 1), isActive: false });
    await repo.save({ startDate: new Date(2026, 2, 1), isActive: false });
    await repo.save({ startDate: new Date(2026, 1, 1), isActive: true });

    const all = await repo.findAll();
    expect(all.success).toBe(true);
    if (!all.success) return;
    const months = all.value.map((c) => c.startDate.getMonth());
    expect(months).toEqual([2, 1, 0]);
  });

  it('observeActive emite el estado inicial y re-emite tras un cambio', async () => {
    const repo = await setup();
    const emissions: (string | null)[] = [];
    const sub = repo
      .observeActive()
      .subscribe((c) => emissions.push(c?.id ?? null));

    await repo.save({ startDate: new Date(2026, 4, 1), isActive: true });
    await new Promise((r) => setTimeout(r, 0));

    sub.unsubscribe();
    expect(emissions[0]).toBeNull();
    expect(emissions[emissions.length - 1]).not.toBeNull();
  });
});
