// __tests__/presentation/viewmodels/selectHomeViewModel.test.ts

import {
  selectHomeViewModel,
  type HomeViewModelState,
} from '@viewmodels/selectHomeViewModel';
import { domainError } from '@domain/entities/DomainError';
import { buildCycle, buildCycleDay } from '../../helpers/factories';

const SETTINGS = { userName: 'Tiana', temperatureUnit: 'celsius' as const };

const emptyState: HomeViewModelState = {
  cycle: null,
  todayEntry: null,
  fertilityStatus: null,
  isLoading: false,
  error: null,
};

describe('selectHomeViewModel', () => {
  it('sin ciclo activo: día 0 y mensajes por defecto', () => {
    const data = selectHomeViewModel({
      state: emptyState,
      settings: SETTINGS,
      today: new Date(2026, 0, 5),
    });

    expect(data.currentCycleDay).toBe(0);
    expect(data.fertilityLabel).toBe('Sin datos');
    expect(data.fertilityMessage).toBe('Registra tu día para empezar.');
    expect(data.hasTodayEntry).toBe(false);
    expect(data.todayTemperature).toBeNull();
  });

  it('con ciclo activo: calcula el día del ciclo a partir de startDate', () => {
    const cycle = buildCycle({ startDate: new Date(2026, 0, 1) });
    const data = selectHomeViewModel({
      state: { ...emptyState, cycle },
      settings: SETTINGS,
      today: new Date(2026, 0, 10),
    });

    expect(data.currentCycleDay).toBe(10);
  });

  it('con registro de hoy: expone la temperatura formateada y el moco', () => {
    const cycle = buildCycle({ startDate: new Date(2026, 0, 1) });
    const todayEntry = buildCycleDay({
      dayNumber: 5,
      basalTemp: 36.5,
      mucusType: 'creamy',
    });
    const data = selectHomeViewModel({
      state: { ...emptyState, cycle, todayEntry },
      settings: SETTINGS,
      today: new Date(2026, 0, 5),
    });

    expect(data.hasTodayEntry).toBe(true);
    expect(data.todayTemperature).toBe('36.50 °C');
    expect(data.todayMucusLabel).toBe('Cremoso');
  });

  it('con fertilityStatus: usa el color/label/mensaje de la fase', () => {
    const data = selectHomeViewModel({
      state: {
        ...emptyState,
        fertilityStatus: {
          phase: 'peak_phase',
          confidence: 'probable',
          isFertileWindow: true,
          message: 'Fase de Peak',
          detail: 'detalle',
        },
      },
      settings: SETTINGS,
      today: new Date(2026, 0, 5),
    });

    expect(data.fertilityLabel).toBe('Muy fértil');
    expect(data.fertilityMessage).toBe('Fase de Peak');
  });

  it('con error: lo traduce a un mensaje para la usuaria', () => {
    const data = selectHomeViewModel({
      state: { ...emptyState, error: domainError('NO_ACTIVE_CYCLE', 'x') },
      settings: SETTINGS,
      today: new Date(2026, 0, 5),
    });

    expect(data.error).toBe(
      'Aún no has iniciado un ciclo. Empieza uno para registrar.'
    );
  });
});
