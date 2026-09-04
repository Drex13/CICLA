// src/presentation/viewmodels/selectLogEntryViewModel.ts
// Estado del formulario → datos listos para LogEntryScreen. Sin lógica de
// negocio: opciones, etiquetas, placeholder por unidad y mensaje de error.

import {
  ALL_CERVICAL_MUCUS,
  type CervicalMucus,
} from '@domain/entities/CervicalMucus';
import type { BleedingLevel } from '@domain/entities/CycleDay';
import type { DomainError } from '@domain/entities/DomainError';
import { bleedingLabel, mucusLabel } from '@viewmodels/fertilityPresentation';
import { domainErrorToMessage } from '@viewmodels/errorPresentation';
import { formatIsoDate } from '@shared/utils/dateUtils';
import type { TemperatureUnit } from '@shared/utils/temperatureUtils';

export interface Option<T> {
  readonly value: T;
  readonly label: string;
}

export interface LogEntryViewModelState {
  readonly date: Date;
  readonly basalTempInput: string;
  readonly mucusType: CervicalMucus;
  readonly bleedingLevel: BleedingLevel | null;
  readonly isPeakDay: boolean;
  readonly notes: string;
  readonly isSubmitting: boolean;
  readonly formError: string | null;
  readonly domainError: DomainError | null;
}

export interface LogEntryViewModelData {
  readonly dateLabel: string;
  readonly basalTempInput: string;
  readonly basalTempPlaceholder: string;
  readonly mucusType: CervicalMucus;
  readonly mucusOptions: readonly Option<CervicalMucus>[];
  readonly bleedingLevel: BleedingLevel | null;
  readonly bleedingOptions: readonly Option<BleedingLevel>[];
  readonly isPeakDay: boolean;
  readonly notes: string;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly error: string | null;
}

const BLEEDING_LEVELS: readonly BleedingLevel[] = ['light', 'medium', 'heavy'];

export const selectLogEntryViewModel = (input: {
  state: LogEntryViewModelState;
  unit: TemperatureUnit;
}): LogEntryViewModelData => {
  const { state, unit } = input;
  return {
    dateLabel: formatIsoDate(state.date),
    basalTempInput: state.basalTempInput,
    basalTempPlaceholder: unit === 'fahrenheit' ? '98.33' : '36.85',
    mucusType: state.mucusType,
    mucusOptions: ALL_CERVICAL_MUCUS.map((value) => ({
      value,
      label: mucusLabel(value),
    })),
    bleedingLevel: state.bleedingLevel,
    bleedingOptions: BLEEDING_LEVELS.map((value) => ({
      value,
      label: bleedingLabel(value),
    })),
    isPeakDay: state.isPeakDay,
    notes: state.notes,
    isSubmitting: state.isSubmitting,
    canSubmit: !state.isSubmitting,
    error:
      state.formError ??
      (state.domainError ? domainErrorToMessage(state.domainError) : null),
  };
};
