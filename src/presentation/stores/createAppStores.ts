// src/presentation/stores/createAppStores.ts
// Fábrica que arma los tres stores con sus dependencias (UseCases). El wiring
// real (repos Drizzle → UseCases → stores) lo hará app/_layout.tsx en Fase 4;
// los tests la llaman con UseCases sobre repos falsos.

import type { StoreApi } from 'zustand/vanilla';
import type { IAnalyzeCurrentCycleUseCase } from '@domain/usecases/AnalyzeCurrentCycleUseCase';
import type { IGetCurrentCycleUseCase } from '@domain/usecases/GetCurrentCycleUseCase';
import type { ILogDailyEntryUseCase } from '@domain/usecases/LogDailyEntryUseCase';
import type { IStartNewCycleUseCase } from '@domain/usecases/StartNewCycleUseCase';
import { createCycleStore, type CycleState } from '@stores/cycleStore';
import { createLogEntryStore, type LogEntryState } from '@stores/logEntryStore';
import {
  createSettingsStore,
  type SettingsState,
  type SettingsStoreDeps,
} from '@stores/settingsStore';

export interface AppStoresDeps {
  readonly getCurrentCycle: IGetCurrentCycleUseCase;
  readonly analyzeCurrentCycle: IAnalyzeCurrentCycleUseCase;
  readonly startNewCycle: IStartNewCycleUseCase;
  readonly logDailyEntry: ILogDailyEntryUseCase;
  readonly settings?: SettingsStoreDeps;
  readonly now?: () => Date;
}

export interface AppStores {
  readonly cycle: StoreApi<CycleState>;
  readonly logEntry: StoreApi<LogEntryState>;
  readonly settings: StoreApi<SettingsState>;
}

export const createAppStores = (deps: AppStoresDeps): AppStores => ({
  cycle: createCycleStore({
    getCurrentCycle: deps.getCurrentCycle,
    analyzeCurrentCycle: deps.analyzeCurrentCycle,
    startNewCycle: deps.startNewCycle,
    ...(deps.now ? { now: deps.now } : {}),
  }),
  logEntry: createLogEntryStore({ logDailyEntry: deps.logDailyEntry }),
  settings: createSettingsStore(deps.settings ?? {}),
});
