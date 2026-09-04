// src/presentation/stores/cycleStore.ts
// Estado del ciclo activo. Regla R03: NO contiene lógica de negocio — solo
// llama a UseCases y actualiza el estado (doc §6.2).

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Cycle } from '@domain/entities/Cycle';
import type { CycleDay } from '@domain/entities/CycleDay';
import type { DomainError } from '@domain/entities/DomainError';
import type { FertilityStatus } from '@domain/entities/FertilityStatus';
import type { IAnalyzeCurrentCycleUseCase } from '@domain/usecases/AnalyzeCurrentCycleUseCase';
import type { IGetCurrentCycleUseCase } from '@domain/usecases/GetCurrentCycleUseCase';
import type { IStartNewCycleUseCase } from '@domain/usecases/StartNewCycleUseCase';
import type { BaselineTemperature } from '@domain/usecases/DetermineBaselineTemperatureUseCase';

export interface CycleStoreDeps {
  readonly getCurrentCycle: IGetCurrentCycleUseCase;
  readonly analyzeCurrentCycle: IAnalyzeCurrentCycleUseCase;
  readonly startNewCycle: IStartNewCycleUseCase;
  /** Inyectable para tests. */
  readonly now?: () => Date;
}

export interface CycleState {
  // ─── Estado
  readonly cycle: Cycle | null;
  readonly daysInCycle: readonly CycleDay[];
  readonly todayEntry: CycleDay | null;
  readonly fertilityStatus: FertilityStatus | null;
  readonly baseline: BaselineTemperature | null;
  readonly peakDayNumber: number | null;
  readonly isLoading: boolean;
  readonly error: DomainError | null;

  // ─── Acciones
  load(): Promise<void>;
  refreshAnalysis(): Promise<void>;
  /** `true` si el ciclo se creó; `false` si hubo error (queda en `error`). */
  startNewCycle(startDate: Date): Promise<boolean>;
  clearError(): void;
}

export const createCycleStore = (
  deps: CycleStoreDeps
): StoreApi<CycleState> => {
  const now = deps.now ?? ((): Date => new Date());

  return createStore<CycleState>((set, get) => ({
    cycle: null,
    daysInCycle: [],
    todayEntry: null,
    fertilityStatus: null,
    baseline: null,
    peakDayNumber: null,
    isLoading: false,
    error: null,

    load: async () => {
      set({ isLoading: true, error: null });
      const snapshot = await deps.getCurrentCycle.execute({ today: now() });
      if (!snapshot.success) {
        set({ isLoading: false, error: snapshot.error });
        return;
      }
      set({
        cycle: snapshot.value.cycle,
        daysInCycle: snapshot.value.daysInCycle,
        todayEntry: snapshot.value.todayEntry,
      });
      await get().refreshAnalysis();
      set({ isLoading: false });
    },

    refreshAnalysis: async () => {
      const result = await deps.analyzeCurrentCycle.execute({ today: now() });
      if (!result.success) {
        set({ error: result.error });
        return;
      }
      set({
        fertilityStatus: result.value.status,
        baseline: result.value.baseline,
        peakDayNumber: result.value.peakDayNumber,
      });
    },

    startNewCycle: async (startDate: Date) => {
      set({ isLoading: true, error: null });
      const result = await deps.startNewCycle.execute({ startDate });
      if (!result.success) {
        set({ isLoading: false, error: result.error });
        return false;
      }
      await get().load();
      return true;
    },

    clearError: () => set({ error: null }),
  }));
};
