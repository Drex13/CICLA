// __tests__/presentation/stores/createAppStores.test.ts
// Smoke test del wiring: createAppStores solo debe armar los tres stores con
// las dependencias dadas, sin lógica propia.

import { createAppStores } from '@stores/createAppStores';
import type { IGetCurrentCycleUseCase } from '@domain/usecases/GetCurrentCycleUseCase';
import type { IAnalyzeCurrentCycleUseCase } from '@domain/usecases/AnalyzeCurrentCycleUseCase';
import type { IStartNewCycleUseCase } from '@domain/usecases/StartNewCycleUseCase';
import type { ILogDailyEntryUseCase } from '@domain/usecases/LogDailyEntryUseCase';
import { ok } from '@shared/types/common';
import { buildCycle, buildCycleDay } from '../../helpers/factories';

describe('createAppStores', () => {
  it('crea los tres stores con su estado inicial', () => {
    const getCurrentCycle: IGetCurrentCycleUseCase = { execute: jest.fn() };
    const analyzeCurrentCycle: IAnalyzeCurrentCycleUseCase = {
      execute: jest.fn(),
    };
    const startNewCycle: IStartNewCycleUseCase = { execute: jest.fn() };
    const logDailyEntry: ILogDailyEntryUseCase = { execute: jest.fn() };

    const stores = createAppStores({
      getCurrentCycle,
      analyzeCurrentCycle,
      startNewCycle,
      logDailyEntry,
    });

    expect(stores.cycle.getState().cycle).toBeNull();
    expect(stores.logEntry.getState().notes).toBe('');
    expect(stores.settings.getState().isHydrated).toBe(false);
  });

  it('el cycleStore creado usa el getCurrentCycle inyectado', async () => {
    const snapshot = {
      cycle: buildCycle({ id: 'c1' }),
      daysInCycle: [buildCycleDay({ dayNumber: 1, cycleId: 'c1' })],
      todayEntry: null,
    };
    const getCurrentCycle: IGetCurrentCycleUseCase = {
      execute: jest.fn().mockResolvedValue(ok(snapshot)),
    };
    const analyzeCurrentCycle: IAnalyzeCurrentCycleUseCase = {
      execute: jest.fn().mockResolvedValue(
        ok({
          status: null,
          baseline: null,
          peakDayNumber: null,
          evaluatedDayNumber: null,
        })
      ),
    };
    const stores = createAppStores({
      getCurrentCycle,
      analyzeCurrentCycle,
      startNewCycle: { execute: jest.fn() },
      logDailyEntry: { execute: jest.fn() },
    });

    await stores.cycle.getState().load();

    expect(stores.cycle.getState().cycle).toEqual(snapshot.cycle);
    expect(getCurrentCycle.execute).toHaveBeenCalledTimes(1);
  });
});
