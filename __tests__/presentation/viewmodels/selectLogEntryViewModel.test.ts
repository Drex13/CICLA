// __tests__/presentation/viewmodels/selectLogEntryViewModel.test.ts

import {
  selectLogEntryViewModel,
  type LogEntryViewModelState,
} from '@viewmodels/selectLogEntryViewModel';
import { ALL_CERVICAL_MUCUS } from '@domain/entities/CervicalMucus';
import { domainError } from '@domain/entities/DomainError';

const baseState: LogEntryViewModelState = {
  date: new Date(2026, 0, 5),
  basalTempInput: '',
  mucusType: 'none',
  bleedingLevel: null,
  isPeakDay: false,
  notes: '',
  isSubmitting: false,
  formError: null,
  domainError: null,
};

describe('selectLogEntryViewModel', () => {
  it('formatea la fecha como YYYY-MM-DD', () => {
    const data = selectLogEntryViewModel({ state: baseState, unit: 'celsius' });
    expect(data.dateLabel).toBe('2026-01-05');
  });

  it('el placeholder de temperatura depende de la unidad', () => {
    expect(
      selectLogEntryViewModel({ state: baseState, unit: 'celsius' })
        .basalTempPlaceholder
    ).toBe('36.85');
    expect(
      selectLogEntryViewModel({ state: baseState, unit: 'fahrenheit' })
        .basalTempPlaceholder
    ).toBe('98.33');
  });

  it('expone una opción por cada tipo de moco y nivel de sangrado', () => {
    const data = selectLogEntryViewModel({ state: baseState, unit: 'celsius' });
    expect(data.mucusOptions).toHaveLength(ALL_CERVICAL_MUCUS.length);
    expect(data.bleedingOptions.map((o) => o.value)).toEqual([
      'light',
      'medium',
      'heavy',
    ]);
  });

  it('canSubmit es false mientras se está enviando', () => {
    const data = selectLogEntryViewModel({
      state: { ...baseState, isSubmitting: true },
      unit: 'celsius',
    });
    expect(data.canSubmit).toBe(false);
  });

  it('prioriza el error de formato sobre el error de dominio', () => {
    const data = selectLogEntryViewModel({
      state: {
        ...baseState,
        formError: 'Formato inválido',
        domainError: domainError('NO_ACTIVE_CYCLE', 'x'),
      },
      unit: 'celsius',
    });
    expect(data.error).toBe('Formato inválido');
  });

  it('sin error de formato: traduce el error de dominio', () => {
    const data = selectLogEntryViewModel({
      state: { ...baseState, domainError: domainError('NO_ACTIVE_CYCLE', 'x') },
      unit: 'celsius',
    });
    expect(data.error).toBe(
      'Aún no has iniciado un ciclo. Empieza uno para registrar.'
    );
  });

  it('sin ningún error: error es null', () => {
    const data = selectLogEntryViewModel({ state: baseState, unit: 'celsius' });
    expect(data.error).toBeNull();
  });
});
