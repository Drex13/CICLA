// __tests__/presentation/stores/logEntryStore.test.ts

import { createLogEntryStore } from '@stores/logEntryStore';
import type { ILogDailyEntryUseCase } from '@domain/usecases/LogDailyEntryUseCase';
import type { CycleDay } from '@domain/entities/CycleDay';
import type { Result } from '@shared/types/common';
import { ok, err } from '@shared/types/common';
import { domainError } from '@domain/entities/DomainError';
import { buildCycleDay } from '../../helpers/factories';

const makeUseCase = (result: Result<CycleDay>): ILogDailyEntryUseCase => ({
  execute: jest.fn().mockResolvedValue(result),
});

describe('logEntryStore', () => {
  it('arranca con un formulario vacío para la fecha inicial', () => {
    const store = createLogEntryStore({
      logDailyEntry: makeUseCase(ok(buildCycleDay({ dayNumber: 1 }))),
    });

    const state = store.getState();
    expect(state.basalTempInput).toBe('');
    expect(state.mucusType).toBe('none');
    expect(state.bleedingLevel).toBeNull();
    expect(state.isPeakDay).toBe(false);
    expect(state.formError).toBeNull();
  });

  it('submit(): con temperatura inválida, no llama al UseCase y deja formError', async () => {
    const logDailyEntry = makeUseCase(ok(buildCycleDay({ dayNumber: 1 })));
    const store = createLogEntryStore({ logDailyEntry });

    store.getState().setBasalTempInput('no-es-un-numero');
    const result = await store.getState().submit('celsius');

    expect(result).toBeNull();
    expect(logDailyEntry.execute).not.toHaveBeenCalled();
    expect(store.getState().formError).not.toBeNull();
    expect(store.getState().isSubmitting).toBe(false);
  });

  it('submit(): con temperatura válida en Celsius, delega al UseCase con °C', async () => {
    const saved = buildCycleDay({ dayNumber: 1, basalTemp: 36.55 });
    const logDailyEntry = makeUseCase(ok(saved));
    const store = createLogEntryStore({ logDailyEntry });

    store.getState().setBasalTempInput('36,55');
    store.getState().setMucusType('creamy');
    const result = await store.getState().submit('celsius');

    expect(result).toEqual(ok(saved));
    expect(logDailyEntry.execute).toHaveBeenCalledWith(
      expect.objectContaining({ basalTemp: 36.55, mucusType: 'creamy' })
    );
    expect(store.getState().isSubmitting).toBe(false);
    expect(store.getState().domainError).toBeNull();
  });

  it('submit(): convierte la temperatura desde Fahrenheit antes de enviarla', async () => {
    const logDailyEntry = makeUseCase(ok(buildCycleDay({ dayNumber: 1 })));
    const store = createLogEntryStore({ logDailyEntry });

    store.getState().setBasalTempInput('98.33');
    await store.getState().submit('fahrenheit');

    const call = (logDailyEntry.execute as jest.Mock).mock.calls[0]?.[0];
    expect(call.basalTemp).toBeCloseTo(36.85, 2);
  });

  it('submit(): sin temperatura ingresada, envía basalTemp omitido', async () => {
    const logDailyEntry = makeUseCase(ok(buildCycleDay({ dayNumber: 1 })));
    const store = createLogEntryStore({ logDailyEntry });

    await store.getState().submit('celsius');

    const call = (logDailyEntry.execute as jest.Mock).mock.calls[0]?.[0];
    expect('basalTemp' in call).toBe(false);
  });

  it('submit(): si el UseCase falla, expone el domainError', async () => {
    const error = domainError('NO_ACTIVE_CYCLE', 'sin ciclo activo');
    const logDailyEntry = makeUseCase(err(error));
    const store = createLogEntryStore({ logDailyEntry });

    const result = await store.getState().submit('celsius');

    expect(result).toEqual(err(error));
    expect(store.getState().domainError).toEqual(error);
  });

  it('loadFrom(): precarga el formulario formateando la temperatura en la unidad dada', () => {
    const day = buildCycleDay({
      dayNumber: 3,
      basalTemp: 36.5,
      mucusType: 'watery',
      bleedingLevel: 'light',
      isPeakDay: true,
      notes: 'nota',
    });
    const logDailyEntry = makeUseCase(ok(day));
    const store = createLogEntryStore({ logDailyEntry });

    store.getState().loadFrom(day, 'celsius');

    const state = store.getState();
    expect(state.basalTempInput).toBe('36.50');
    expect(state.mucusType).toBe('watery');
    expect(state.bleedingLevel).toBe('light');
    expect(state.isPeakDay).toBe(true);
    expect(state.notes).toBe('nota');
  });

  it('reset(): vacía el formulario para la fecha dada', () => {
    const logDailyEntry = makeUseCase(ok(buildCycleDay({ dayNumber: 1 })));
    const store = createLogEntryStore({ logDailyEntry });
    store.getState().setNotes('algo');
    const newDate = new Date(2026, 1, 1);

    store.getState().reset(newDate);

    const state = store.getState();
    expect(state.notes).toBe('');
    expect(state.date).toEqual(newDate);
  });
});
