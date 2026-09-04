// src/presentation/stores/settingsStore.ts
// Preferencias de usuaria: nombre, unidad de temperatura, hora de notificación.
// No maneja datos del ciclo (doc §6.1). La persistencia es un puerto opcional
// (su implementación real —SecureStore/AsyncStorage— llega en Fase 5).

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { TemperatureUnit } from '@shared/utils/temperatureUtils';

export interface Settings {
  readonly userName: string;
  readonly temperatureUnit: TemperatureUnit;
  /** Hora local 0–23 del recordatorio diario; `null` si está desactivado. */
  readonly notificationHour: number | null;
}

export interface SettingsStoragePort {
  load(): Promise<Partial<Settings> | null>;
  save(settings: Settings): Promise<void>;
}

export interface SettingsStoreDeps {
  readonly storage?: SettingsStoragePort;
  readonly initial?: Partial<Settings>;
}

export interface SettingsState extends Settings {
  readonly isHydrated: boolean;
  setUserName(value: string): void;
  setTemperatureUnit(value: TemperatureUnit): void;
  setNotificationHour(value: number | null): void;
  /** Carga las preferencias persistidas (si hay puerto de storage). */
  hydrate(): Promise<void>;
  reset(): void;
}

export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  temperatureUnit: 'celsius',
  notificationHour: null,
};

export const createSettingsStore = (
  deps: SettingsStoreDeps = {}
): StoreApi<SettingsState> =>
  createStore<SettingsState>((set, get) => {
    const persist = (): void => {
      const { userName, temperatureUnit, notificationHour } = get();
      void deps.storage?.save({ userName, temperatureUnit, notificationHour });
    };

    return {
      ...DEFAULT_SETTINGS,
      ...deps.initial,
      isHydrated: false,

      setUserName: (userName) => {
        set({ userName });
        persist();
      },
      setTemperatureUnit: (temperatureUnit) => {
        set({ temperatureUnit });
        persist();
      },
      setNotificationHour: (notificationHour) => {
        set({ notificationHour });
        persist();
      },

      hydrate: async () => {
        const stored = (await deps.storage?.load()) ?? null;
        if (stored !== null) set(stored);
        set({ isHydrated: true });
      },

      reset: () => {
        set({ ...DEFAULT_SETTINGS });
        persist();
      },
    };
  });
