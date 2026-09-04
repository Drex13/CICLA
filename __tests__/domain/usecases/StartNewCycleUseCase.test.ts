// __tests__/domain/usecases/StartNewCycleUseCase.test.ts

import { StartNewCycleUseCase } from '@domain/usecases/StartNewCycleUseCase';
import { addCivilDays } from '@shared/utils/dateUtils';
import { FakeCycleRepository } from '../../helpers/fakeRepositories';
import { buildCycle } from '../../helpers/factories';

describe('StartNewCycleUseCase', () => {
  it('sin ciclo previo: crea un ciclo activo abierto (sin endDate)', async () => {
    const repo = new FakeCycleRepository();
    const useCase = new StartNewCycleUseCase(repo);
    const start = addCivilDays(new Date(), -2);

    const result = await useCase.execute({ startDate: start });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.cycle.isActive).toBe(true);
    expect(result.value.cycle.endDate).toBeUndefined();
  });

  it('con ciclo activo y separación normal: cierra el anterior y abre el nuevo', async () => {
    const previousStart = addCivilDays(new Date(), -30);
    const repo = new FakeCycleRepository([
      buildCycle({ id: 'old', startDate: previousStart, isActive: true }),
    ]);
    const useCase = new StartNewCycleUseCase(repo);
    const newStart = addCivilDays(new Date(), -2);

    const result = await useCase.execute({ startDate: newStart });

    expect(result.success).toBe(true);
    const old = repo.cycles.find((c) => c.id === 'old');
    expect(old?.isActive).toBe(false);
    expect(old?.endDate).toEqual(addCivilDays(newStart, -1));
    expect(repo.cycles.filter((c) => c.isActive)).toHaveLength(1);
  });

  it('separación menor al mínimo típico → CYCLE_TOO_SHORT', async () => {
    const repo = new FakeCycleRepository([
      buildCycle({
        id: 'old',
        startDate: addCivilDays(new Date(), -10),
        isActive: true,
      }),
    ]);
    const useCase = new StartNewCycleUseCase(repo);

    const result = await useCase.execute({ startDate: new Date() });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('CYCLE_TOO_SHORT');
  });

  it('fecha de inicio en el futuro → VALIDATION_ERROR', async () => {
    const repo = new FakeCycleRepository();
    const useCase = new StartNewCycleUseCase(repo);

    const result = await useCase.execute({
      startDate: addCivilDays(new Date(), 3),
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('separación mayor al máximo típico: se permite y marca longitud atípica', async () => {
    const repo = new FakeCycleRepository([
      buildCycle({
        id: 'old',
        startDate: addCivilDays(new Date(), -50),
        isActive: true,
      }),
    ]);
    const useCase = new StartNewCycleUseCase(repo);

    const result = await useCase.execute({
      startDate: addCivilDays(new Date(), -1),
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.previousCycleAtypicalLength).toBe(true);
  });
});
