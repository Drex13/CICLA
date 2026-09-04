// __tests__/domain/usecases/GetCycleStatisticsUseCase.test.ts

import type { CycleDay } from '@domain/entities/CycleDay';
import { GetCycleStatisticsUseCase } from '@domain/usecases/GetCycleStatisticsUseCase';
import {
  buildCycle,
  buildTestCycleDays,
  type CycleDaySeed,
} from '../../helpers/factories';

const useCase = new GetCycleStatisticsUseCase();

describe('GetCycleStatisticsUseCase', () => {
  it('sin ciclos: totales en cero y promedios en null', () => {
    const result = useCase.execute({ cycles: [], daysByCycleId: {} });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.totalCycles).toBe(0);
    expect(result.value.averageCycleLength).toBeNull();
    expect(result.value.averageLutealPhaseLength).toBeNull();
  });

  it('calcula longitud media / mínima / máxima solo de ciclos completos', () => {
    const cycles = [
      buildCycle({
        id: 'a',
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 28), // 28 días
        isActive: false,
      }),
      buildCycle({
        id: 'b',
        startDate: new Date(2026, 1, 1),
        endDate: new Date(2026, 1, 2 + 28), // 30 días
        isActive: false,
      }),
      buildCycle({ id: 'c', startDate: new Date(2026, 2, 1), isActive: true }),
    ];
    const result = useCase.execute({ cycles, daysByCycleId: {} });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.totalCycles).toBe(3);
    expect(result.value.completedCycles).toBe(2);
    expect(result.value.shortestCycleLength).toBe(28);
    expect(result.value.longestCycleLength).toBe(30);
    expect(result.value.averageCycleLength).toBe(29);
  });

  it('deriva la fase lútea media a partir del cambio térmico', () => {
    const seeds: CycleDaySeed[] = [
      ...Array.from({ length: 12 }, (_u, i) => ({
        dayNumber: i + 1,
        basalTemp: 36.4,
        mucusType: 'none' as const,
        cycleId: 'a',
      })),
      { dayNumber: 13, basalTemp: 36.7, mucusType: 'sticky', cycleId: 'a' },
      { dayNumber: 14, basalTemp: 36.8, mucusType: 'none', cycleId: 'a' },
      { dayNumber: 15, basalTemp: 36.9, mucusType: 'none', cycleId: 'a' },
    ];
    const days: CycleDay[] = buildTestCycleDays(seeds);
    const cycles = [
      buildCycle({
        id: 'a',
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 28), // 28 días
        isActive: false,
      }),
    ];
    const result = useCase.execute({
      cycles,
      daysByCycleId: { a: days },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    // cambio térmico el día 13 → fase lútea = 28 - 13 + 1 = 16
    expect(result.value.averageLutealPhaseLength).toBe(16);
  });
});
