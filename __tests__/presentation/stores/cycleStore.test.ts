// __tests__/presentation/stores/cycleStore.test.ts
// El store no tiene lógica de negocio: solo verificamos que orquesta los
// UseCases y refleja su resultado en el estado (regla R03).

import { createCycleStore } from '@stores/cycleStore';
import type {
  CurrentCycleSnapshot,
  IGetCurrentCycleUseCase,
} from '@domain/usecases/GetCurrentCycleUseCase';
import type {
  CurrentCycleAnalysis,
  IAnalyzeCurrentCycleUseCase,
} from '@domain/usecases/AnalyzeCurrentCycleUseCase';
import type {
  IStartNewCycleUseCase,
  StartNewCycleResult,
} from '@domain/usecases/StartNewCycleUseCase';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';
import { notFoundError } from '@domain/entities/DomainError';
import { buildCycle, buildCycleDay } from '../../helpers/factories';

const SNAPSHOT: CurrentCycleSnapshot = {
  cycle: buildCycle({ id: 'c1' }),
  daysInCycle: [buildCycleDay({ dayNumber: 1, cycleId: 'c1' })],
  todayEntry: buildCycleDay({ dayNumber: 1, cycleId: 'c1' }),
};

const ANALYSIS: CurrentCycleAnalysis = {
  status: {
    phase: 'fertile_building',
    confidence: 'probable',
    isFertileWindow: true,
    message: 'Fertilidad en aumento',
    detail: 'detalle',
  },
  baseline: null,
  peakDayNumber: null,
  evaluatedDayNumber: 1,
};

const makeDeps = (overrides?: {
  getCurrentCycle?: Result<CurrentCycleSnapshot>;
  analyzeCurrentCycle?: Result<CurrentCycleAnalysis>;
  startNewCycle?: Result<StartNewCycleResult>;
}) => {
  const getCurrentCycle: IGetCurrentCycleUseCase = {
    execute: jest
      .fn()
      .mockResolvedValue(overrides?.getCurrentCycle ?? ok(SNAPSHOT)),
  };
  const analyzeCurrentCycle: IAnalyzeCurrentCycleUseCase = {
    execute: jest
      .fn()
      .mockResolvedValue(overrides?.analyzeCurrentCycle ?? ok(ANALYSIS)),
  };
  const startNewCycle: IStartNewCycleUseCase = {
    execute: jest.fn().mockResolvedValue(
      overrides?.startNewCycle ??
        ok({
          cycle: buildCycle({ id: 'c2' }),
          previousCycleAtypicalLength: false,
        })
    ),
  };
  return { getCurrentCycle, analyzeCurrentCycle, startNewCycle };
};

describe('cycleStore', () => {
  it('load(): carga el snapshot y encadena el análisis de fertilidad', async () => {
    const deps = makeDeps();
    const store = createCycleStore(deps);

    await store.getState().load();

    const state = store.getState();
    expect(state.cycle).toEqual(SNAPSHOT.cycle);
    expect(state.daysInCycle).toEqual(SNAPSHOT.daysInCycle);
    expect(state.todayEntry).toEqual(SNAPSHOT.todayEntry);
    expect(state.fertilityStatus).toEqual(ANALYSIS.status);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(deps.analyzeCurrentCycle.execute).toHaveBeenCalledTimes(1);
  });

  it('load(): si getCurrentCycle falla, deja el error y no llama al análisis', async () => {
    const error = notFoundError('sin ciclo');
    const deps = makeDeps({ getCurrentCycle: err(error) });
    const store = createCycleStore(deps);

    await store.getState().load();

    const state = store.getState();
    expect(state.error).toEqual(error);
    expect(state.isLoading).toBe(false);
    expect(state.cycle).toBeNull();
    expect(deps.analyzeCurrentCycle.execute).not.toHaveBeenCalled();
  });

  it('refreshAnalysis(): si el análisis falla, solo actualiza el error', async () => {
    const error = notFoundError('sin datos');
    const deps = makeDeps({ analyzeCurrentCycle: err(error) });
    const store = createCycleStore(deps);

    await store.getState().refreshAnalysis();

    expect(store.getState().error).toEqual(error);
    expect(store.getState().fertilityStatus).toBeNull();
  });

  it('startNewCycle(): en éxito recarga el estado y devuelve true', async () => {
    const deps = makeDeps();
    const store = createCycleStore(deps);

    const success = await store.getState().startNewCycle(new Date(2026, 0, 1));

    expect(success).toBe(true);
    expect(deps.getCurrentCycle.execute).toHaveBeenCalledTimes(1);
    expect(store.getState().error).toBeNull();
  });

  it('startNewCycle(): en error devuelve false y expone el error sin recargar', async () => {
    const error = notFoundError('ciclo demasiado corto');
    const deps = makeDeps({ startNewCycle: err(error) });
    const store = createCycleStore(deps);

    const success = await store.getState().startNewCycle(new Date(2026, 0, 1));

    expect(success).toBe(false);
    expect(store.getState().error).toEqual(error);
    expect(deps.getCurrentCycle.execute).not.toHaveBeenCalled();
  });

  it('clearError(): limpia el error sin tocar el resto del estado', async () => {
    const deps = makeDeps({ getCurrentCycle: err(notFoundError('x')) });
    const store = createCycleStore(deps);
    await store.getState().load();
    expect(store.getState().error).not.toBeNull();

    store.getState().clearError();

    expect(store.getState().error).toBeNull();
  });
});
