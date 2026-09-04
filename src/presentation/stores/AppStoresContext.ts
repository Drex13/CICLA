// src/presentation/stores/AppStoresContext.ts
// Puente entre los stores vanilla de zustand y el árbol de React. El wiring
// real (repos Drizzle → UseCases → stores → Provider) vive en app/_layout.tsx;
// aquí solo se define el contrato para consumirlos desde componentes/pantallas.

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { AppStores } from '@stores/createAppStores';
import type { CycleState } from '@stores/cycleStore';
import type { LogEntryState } from '@stores/logEntryStore';
import type { SettingsState } from '@stores/settingsStore';

export const AppStoresContext = createContext<AppStores | null>(null);

const useAppStores = (): AppStores => {
  const stores = useContext(AppStoresContext);
  if (stores === null) {
    throw new Error(
      'useAppStores debe usarse dentro de <AppStoresContext.Provider>.'
    );
  }
  return stores;
};

export const useCycleStore = <T>(selector: (state: CycleState) => T): T =>
  useStore(useAppStores().cycle, selector);

export const useLogEntryStore = <T>(selector: (state: LogEntryState) => T): T =>
  useStore(useAppStores().logEntry, selector);

export const useSettingsStore = <T>(selector: (state: SettingsState) => T): T =>
  useStore(useAppStores().settings, selector);
