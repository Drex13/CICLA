// src/presentation/stores/logEntryStore.ts
// Estado del formulario de registro diario. Guarda el input CRUDO (la temperatura
// como string). La validación de FORMATO es de presentación y vive aquí; la
// validación BIOLÓGICA la hace LogDailyEntryUseCase. Regla R03: sin reglas de
// negocio. No maneja datos del ciclo ni settings (doc §6.1).

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { CervicalMucus } from '@domain/entities/CervicalMucus';
import type {
  BleedingLevel,
  CervixPosition,
  CycleDay,
} from '@domain/entities/CycleDay';
import type { DomainError } from '@domain/entities/DomainError';
import type {
  ILogDailyEntryUseCase,
  LogDailyEntryInput,
} from '@domain/usecases/LogDailyEntryUseCase';
import type { Result } from '@shared/types/common';
import {
  parseTemperatureInput,
  type TemperatureUnit,
} from '@shared/utils/temperatureUtils';

export interface LogEntryStoreDeps {
  readonly logDailyEntry: ILogDailyEntryUseCase;
}

export interface LogEntryState {
  // ─── Estado del formulario
  readonly date: Date;
  readonly basalTempInput: string;
  readonly mucusType: CervicalMucus;
  readonly bleedingLevel: BleedingLevel | null;
  readonly cervixPosition: CervixPosition | null;
  readonly isPeakDay: boolean;
  readonly notes: string;
  readonly isSubmitting: boolean;
  /** Error de formato (presentación), listo para mostrar. */
  readonly formError: string | null;
  /** Error devuelto por el dominio en el último submit. */
  readonly domainError: DomainError | null;

  // ─── Acciones
  setDate(date: Date): void;
  setBasalTempInput(value: string): void;
  setMucusType(value: CervicalMucus): void;
  setBleedingLevel(value: BleedingLevel | null): void;
  setCervixPosition(value: CervixPosition | null): void;
  setIsPeakDay(value: boolean): void;
  setNotes(value: string): void;
  /** Vacía el formulario para una fecha. */
  reset(date: Date): void;
  /** Precarga el formulario con un día existente (editar). */
  loadFrom(day: CycleDay, unit: TemperatureUnit): void;
  /** Envía el formulario. Devuelve el Result del UseCase, o `null` si ni se
   *  intentó por un error de formato. */
  submit(unit: TemperatureUnit): Promise<Result<CycleDay> | null>;
}

const emptyForm = (date: Date) => ({
  date,
  basalTempInput: '',
  mucusType: 'none' as CervicalMucus,
  bleedingLevel: null as BleedingLevel | null,
  cervixPosition: null as CervixPosition | null,
  isPeakDay: false,
  notes: '',
  isSubmitting: false,
  formError: null as string | null,
  domainError: null as DomainError | null,
});

const formatForUnit = (celsius: number, unit: TemperatureUnit): string =>
  unit === 'fahrenheit' ? (celsius * 1.8 + 32).toFixed(2) : celsius.toFixed(2);

export const createLogEntryStore = (
  deps: LogEntryStoreDeps
): StoreApi<LogEntryState> =>
  createStore<LogEntryState>((set, get) => ({
    ...emptyForm(new Date()),

    setDate: (date) => set({ date }),
    setBasalTempInput: (basalTempInput) =>
      set({ basalTempInput, formError: null }),
    setMucusType: (mucusType) => set({ mucusType }),
    setBleedingLevel: (bleedingLevel) => set({ bleedingLevel }),
    setCervixPosition: (cervixPosition) => set({ cervixPosition }),
    setIsPeakDay: (isPeakDay) => set({ isPeakDay }),
    setNotes: (notes) => set({ notes }),

    reset: (date) => set(emptyForm(date)),

    loadFrom: (day, unit) =>
      set({
        date: day.date,
        basalTempInput:
          day.basalTemp === undefined ? '' : formatForUnit(day.basalTemp, unit),
        mucusType: day.mucusType,
        bleedingLevel: day.bleedingLevel ?? null,
        cervixPosition: day.cervixPosition ?? null,
        isPeakDay: day.isPeakDay,
        notes: day.notes,
        isSubmitting: false,
        formError: null,
        domainError: null,
      }),

    submit: async (unit) => {
      const state = get();
      const raw = state.basalTempInput.trim();

      let basalTemp: number | undefined;
      if (raw !== '') {
        const parsed = parseTemperatureInput(raw, unit);
        if (parsed === null) {
          set({
            formError: 'Introduce una temperatura válida (p. ej. 36.85).',
          });
          return null;
        }
        basalTemp = parsed;
      }

      set({ isSubmitting: true, formError: null, domainError: null });

      const input: LogDailyEntryInput = {
        date: state.date,
        mucusType: state.mucusType,
        isPeakDay: state.isPeakDay,
        notes: state.notes,
        ...(basalTemp !== undefined ? { basalTemp } : {}),
        ...(state.bleedingLevel !== null
          ? { bleedingLevel: state.bleedingLevel }
          : {}),
        ...(state.cervixPosition !== null
          ? { cervixPosition: state.cervixPosition }
          : {}),
      };

      const result = await deps.logDailyEntry.execute(input);
      set({
        isSubmitting: false,
        domainError: result.success ? null : result.error,
      });
      return result;
    },
  }));
