// __tests__/domain/usecases/AnalyzeCurrentCycleUseCase.test.ts

import { AnalyzeCurrentCycleUseCase } from '@domain/usecases/AnalyzeCurrentCycleUseCase';
import {
  FakeCycleDayRepository,
  FakeCycleRepository,
} from '../../helpers/fakeRepositories';
import {
  buildCycle,
  buildPreviousCycles,
  buildTestCycleDays,
} from '../../helpers/factories';
import { addCivilDays } from '@shared/utils/dateUtils';

const CYCLE_START = new Date(2026, 0, 1); // 2026-01-01

describe('AnalyzeCurrentCycleUseCase', () => {
  it('sin ciclo activo: devuelve el resultado vacío', async () => {
    const useCase = new AnalyzeCurrentCycleUseCase(
      new FakeCycleRepository(),
      new FakeCycleDayRepository()
    );

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value).toEqual({
      status: null,
      baseline: null,
      peakDayNumber: null,
      evaluatedDayNumber: null,
    });
  });

  it('ciclo activo sin días registrados: devuelve el resultado vacío', async () => {
    const cycleRepo = new FakeCycleRepository([
      buildCycle({ id: 'c1', startDate: CYCLE_START, isActive: true }),
    ]);
    const useCase = new AnalyzeCurrentCycleUseCase(
      cycleRepo,
      new FakeCycleDayRepository()
    );

    const result = await useCase.execute({ today: CYCLE_START });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.status).toBeNull();
    expect(result.value.evaluatedDayNumber).toBeNull();
  });

  it('con menos de 3 ciclos previos: la fase es insufficient_data', async () => {
    const cycleRepo = new FakeCycleRepository([
      buildCycle({ id: 'c1', startDate: CYCLE_START, isActive: true }),
    ]);
    const days = buildTestCycleDays([
      { dayNumber: 1, mucusType: 'none', cycleId: 'c1' },
      { dayNumber: 2, mucusType: 'none', cycleId: 'c1' },
    ]);
    const useCase = new AnalyzeCurrentCycleUseCase(
      cycleRepo,
      new FakeCycleDayRepository(days)
    );

    const result = await useCase.execute({ today: new Date(2026, 0, 2) });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.status?.phase).toBe('insufficient_data');
    expect(result.value.evaluatedDayNumber).toBe(2);
  });

  it('con 3 ciclos previos completos y moco de máxima fertilidad hoy: fase peak_phase', async () => {
    const previousCyclesDays = buildPreviousCycles(3);
    const previousCycleRecords = previousCyclesDays.map((_days, i) =>
      buildCycle({
        id: `prev-${i}`,
        startDate: addCivilDays(CYCLE_START, -30 * (i + 1)),
        isActive: false,
      })
    );
    const cycleRepo = new FakeCycleRepository([
      ...previousCycleRecords,
      buildCycle({ id: 'c1', startDate: CYCLE_START, isActive: true }),
    ]);
    const currentDays = buildTestCycleDays([
      { dayNumber: 1, mucusType: 'none', cycleId: 'c1' },
      { dayNumber: 10, mucusType: 'egg_white', cycleId: 'c1' },
    ]);
    const dayRepo = new FakeCycleDayRepository([
      ...previousCyclesDays.flat(),
      ...currentDays,
    ]);
    const useCase = new AnalyzeCurrentCycleUseCase(cycleRepo, dayRepo);

    const result = await useCase.execute({ today: new Date(2026, 0, 10) });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.status?.phase).toBe('peak_phase');
    expect(result.value.evaluatedDayNumber).toBe(10);
  });

  it('si hoy no tiene registro: evalúa el último día registrado del ciclo', async () => {
    const cycleRepo = new FakeCycleRepository([
      buildCycle({ id: 'c1', startDate: CYCLE_START, isActive: true }),
    ]);
    const days = buildTestCycleDays([
      { dayNumber: 1, mucusType: 'none', cycleId: 'c1' },
      { dayNumber: 3, mucusType: 'none', cycleId: 'c1' },
    ]);
    const useCase = new AnalyzeCurrentCycleUseCase(
      cycleRepo,
      new FakeCycleDayRepository(days)
    );

    const result = await useCase.execute({ today: new Date(2026, 0, 20) });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.evaluatedDayNumber).toBe(3);
  });
});
