// __tests__/domain/usecases/LogDailyEntryUseCase.test.ts

import { LogDailyEntryUseCase } from '@domain/usecases/LogDailyEntryUseCase';
import {
  FakeCycleDayRepository,
  FakeCycleRepository,
} from '../../helpers/fakeRepositories';
import { buildCycle } from '../../helpers/factories';

const CYCLE_START = new Date(2026, 4, 1); // 2026-05-01

const makeUseCase = (opts: { withActiveCycle: boolean }) => {
  const cycleRepo = new FakeCycleRepository(
    opts.withActiveCycle
      ? [buildCycle({ id: 'c1', startDate: CYCLE_START, isActive: true })]
      : []
  );
  const dayRepo = new FakeCycleDayRepository();
  return {
    useCase: new LogDailyEntryUseCase(cycleRepo, dayRepo),
    dayRepo,
  };
};

const baseInput = {
  mucusType: 'creamy' as const,
  isPeakDay: false,
  notes: '',
};

describe('LogDailyEntryUseCase', () => {
  it('registra un día y deriva dayNumber desde el inicio del ciclo', async () => {
    const { useCase, dayRepo } = makeUseCase({ withActiveCycle: true });
    const result = await useCase.execute({
      ...baseInput,
      date: new Date(2026, 4, 12), // día 12
      basalTemp: 36.55,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.dayNumber).toBe(12);
    expect(result.value.cycleId).toBe('c1');
    expect(result.value.basalTemp).toBe(36.55);
    expect(dayRepo.days).toHaveLength(1);
  });

  it('rechaza temperatura fuera del rango fisiológico absoluto', async () => {
    const { useCase } = makeUseCase({ withActiveCycle: true });
    const result = await useCase.execute({
      ...baseInput,
      date: new Date(2026, 4, 5),
      basalTemp: 33.0,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('TEMPERATURE_OUT_OF_RANGE');
  });

  it('acepta y guarda una temperatura de fiebre (dentro del rango absoluto)', async () => {
    const { useCase } = makeUseCase({ withActiveCycle: true });
    const result = await useCase.execute({
      ...baseInput,
      date: new Date(2026, 4, 6),
      basalTemp: 38.5,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.basalTemp).toBe(38.5);
  });

  it('rechaza una fecha anterior al inicio del ciclo activo', async () => {
    const { useCase } = makeUseCase({ withActiveCycle: true });
    const result = await useCase.execute({
      ...baseInput,
      date: new Date(2026, 3, 20), // abril, antes del 1 de mayo
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('falla si no hay ciclo activo', async () => {
    const { useCase } = makeUseCase({ withActiveCycle: false });
    const result = await useCase.execute({
      ...baseInput,
      date: new Date(2026, 4, 3),
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('NO_ACTIVE_CYCLE');
  });

  it('un segundo registro en la misma fecha actualiza en lugar de duplicar', async () => {
    const { useCase, dayRepo } = makeUseCase({ withActiveCycle: true });
    const date = new Date(2026, 4, 10);
    await useCase.execute({ ...baseInput, date, basalTemp: 36.5 });
    const second = await useCase.execute({
      ...baseInput,
      date,
      basalTemp: 36.6,
      mucusType: 'egg_white',
    });
    expect(second.success).toBe(true);
    expect(dayRepo.days).toHaveLength(1);
    expect(dayRepo.days[0]?.basalTemp).toBe(36.6);
  });
});
