// __tests__/domain/usecases/GetCurrentCycleUseCase.test.ts

import { GetCurrentCycleUseCase } from '@domain/usecases/GetCurrentCycleUseCase';
import {
  FakeCycleDayRepository,
  FakeCycleRepository,
} from '../../helpers/fakeRepositories';
import { buildCycle, buildTestCycleDays } from '../../helpers/factories';

const CYCLE_START = new Date(2026, 0, 1); // 2026-01-01

describe('GetCurrentCycleUseCase', () => {
  it('sin ciclo activo: devuelve el snapshot vacío', async () => {
    const useCase = new GetCurrentCycleUseCase(
      new FakeCycleRepository(),
      new FakeCycleDayRepository()
    );

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value).toEqual({
      cycle: null,
      daysInCycle: [],
      todayEntry: null,
    });
  });

  it('ciclo activo sin días registrados: cycle presente, listas vacías', async () => {
    const cycle = buildCycle({
      id: 'c1',
      startDate: CYCLE_START,
      isActive: true,
    });
    const useCase = new GetCurrentCycleUseCase(
      new FakeCycleRepository([cycle]),
      new FakeCycleDayRepository()
    );

    const result = await useCase.execute({ today: CYCLE_START });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.cycle).toEqual(cycle);
    expect(result.value.daysInCycle).toEqual([]);
    expect(result.value.todayEntry).toBeNull();
  });

  it('con un registro de hoy: lo expone como todayEntry', async () => {
    const cycle = buildCycle({
      id: 'c1',
      startDate: CYCLE_START,
      isActive: true,
    });
    const days = buildTestCycleDays([
      { dayNumber: 1, mucusType: 'none', cycleId: 'c1' },
      { dayNumber: 5, mucusType: 'creamy', cycleId: 'c1' },
    ]);
    const useCase = new GetCurrentCycleUseCase(
      new FakeCycleRepository([cycle]),
      new FakeCycleDayRepository(days)
    );

    const result = await useCase.execute({ today: new Date(2026, 0, 5) });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.daysInCycle).toHaveLength(2);
    expect(result.value.todayEntry?.dayNumber).toBe(5);
  });

  it('si hoy no tiene registro: todayEntry es null (sin caer al último día)', async () => {
    const cycle = buildCycle({
      id: 'c1',
      startDate: CYCLE_START,
      isActive: true,
    });
    const days = buildTestCycleDays([
      { dayNumber: 1, mucusType: 'none', cycleId: 'c1' },
    ]);
    const useCase = new GetCurrentCycleUseCase(
      new FakeCycleRepository([cycle]),
      new FakeCycleDayRepository(days)
    );

    const result = await useCase.execute({ today: new Date(2026, 0, 9) });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.todayEntry).toBeNull();
  });

  it('sin `today` explícito: usa la fecha actual', async () => {
    const cycle = buildCycle({
      id: 'c1',
      startDate: new Date(),
      isActive: true,
    });
    const useCase = new GetCurrentCycleUseCase(
      new FakeCycleRepository([cycle]),
      new FakeCycleDayRepository()
    );

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.cycle?.id).toBe('c1');
  });
});
