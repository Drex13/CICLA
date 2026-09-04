// src/presentation/viewmodels/selectHomeViewModel.ts
// Transformación PURA estado → datos listos para HomeScreen (doc §7.2).
// Sin lógica de negocio: solo formateo y derivación para mostrar.

import type { CycleDay } from '@domain/entities/CycleDay';
import type { Cycle } from '@domain/entities/Cycle';
import type { DomainError } from '@domain/entities/DomainError';
import type { FertilityStatus } from '@domain/entities/FertilityStatus';
import { domainErrorToMessage } from '@viewmodels/errorPresentation';
import {
  fertilityColor,
  fertilityLabel,
  mucusLabel,
  NEUTRAL_COLOR,
} from '@viewmodels/fertilityPresentation';
import type { Settings } from '@stores/settingsStore';
import { daysBetweenCivil } from '@shared/utils/dateUtils';
import { formatTemperature } from '@shared/utils/temperatureUtils';

export interface HomeViewModelState {
  readonly cycle: Cycle | null;
  readonly todayEntry: CycleDay | null;
  readonly fertilityStatus: FertilityStatus | null;
  readonly isLoading: boolean;
  readonly error: DomainError | null;
}

export interface HomeViewModelData {
  readonly userName: string;
  readonly currentCycleDay: number;
  readonly fertilityColor: string;
  readonly fertilityLabel: string;
  readonly fertilityMessage: string;
  readonly todayTemperature: string | null;
  readonly todayMucusLabel: string;
  readonly hasTodayEntry: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export const selectHomeViewModel = (input: {
  state: HomeViewModelState;
  settings: Pick<Settings, 'userName' | 'temperatureUnit'>;
  today: Date;
}): HomeViewModelData => {
  const { state, settings, today } = input;
  const status = state.fertilityStatus;
  const entry = state.todayEntry;

  return {
    userName: settings.userName,
    currentCycleDay:
      state.cycle === null
        ? 0
        : daysBetweenCivil(state.cycle.startDate, today) + 1,
    fertilityColor: status ? fertilityColor(status.phase) : NEUTRAL_COLOR,
    fertilityLabel: status ? fertilityLabel(status.phase) : 'Sin datos',
    fertilityMessage: status ? status.message : 'Registra tu día para empezar.',
    todayTemperature:
      entry && entry.basalTemp !== undefined
        ? formatTemperature(entry.basalTemp, settings.temperatureUnit)
        : null,
    todayMucusLabel: entry ? mucusLabel(entry.mucusType) : '—',
    hasTodayEntry: entry !== null,
    isLoading: state.isLoading,
    error: state.error ? domainErrorToMessage(state.error) : null,
  };
};
