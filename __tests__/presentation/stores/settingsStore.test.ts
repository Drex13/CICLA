// __tests__/presentation/stores/settingsStore.test.ts

import {
  createSettingsStore,
  DEFAULT_SETTINGS,
  type Settings,
  type SettingsStoragePort,
} from '@stores/settingsStore';

const makeStoragePort = (initial: Partial<Settings> | null = null) => {
  const saved: Settings[] = [];
  const storage: SettingsStoragePort = {
    load: jest.fn().mockResolvedValue(initial),
    save: jest.fn().mockImplementation(async (settings: Settings) => {
      saved.push(settings);
    }),
  };
  return { storage, saved };
};

describe('settingsStore', () => {
  it('arranca con los valores por defecto y sin hidratar', () => {
    const store = createSettingsStore();

    expect(store.getState()).toMatchObject(DEFAULT_SETTINGS);
    expect(store.getState().isHydrated).toBe(false);
  });

  it('acepta valores iniciales inyectados (para tests/preview)', () => {
    const store = createSettingsStore({ initial: { userName: 'Tiana' } });

    expect(store.getState().userName).toBe('Tiana');
    expect(store.getState().temperatureUnit).toBe(
      DEFAULT_SETTINGS.temperatureUnit
    );
  });

  it('setUserName/setTemperatureUnit/setNotificationHour actualizan y persisten', () => {
    const { storage, saved } = makeStoragePort();
    const store = createSettingsStore({ storage });

    store.getState().setUserName('Tiana');
    store.getState().setTemperatureUnit('fahrenheit');
    store.getState().setNotificationHour(7);

    expect(store.getState().userName).toBe('Tiana');
    expect(store.getState().temperatureUnit).toBe('fahrenheit');
    expect(store.getState().notificationHour).toBe(7);
    expect(saved).toHaveLength(3);
    expect(saved[saved.length - 1]).toEqual({
      userName: 'Tiana',
      temperatureUnit: 'fahrenheit',
      notificationHour: 7,
    });
  });

  it('hydrate(): sin storage, solo marca isHydrated', async () => {
    const store = createSettingsStore();

    await store.getState().hydrate();

    expect(store.getState().isHydrated).toBe(true);
    expect(store.getState()).toMatchObject(DEFAULT_SETTINGS);
  });

  it('hydrate(): con storage, aplica lo persistido y marca isHydrated', async () => {
    const { storage } = makeStoragePort({
      userName: 'Tiana',
      notificationHour: 8,
    });
    const store = createSettingsStore({ storage });

    await store.getState().hydrate();

    expect(store.getState().userName).toBe('Tiana');
    expect(store.getState().notificationHour).toBe(8);
    expect(store.getState().isHydrated).toBe(true);
  });

  it('reset(): vuelve a los valores por defecto y persiste', () => {
    const { storage, saved } = makeStoragePort();
    const store = createSettingsStore({
      storage,
      initial: { userName: 'Tiana' },
    });

    store.getState().reset();

    expect(store.getState()).toMatchObject(DEFAULT_SETTINGS);
    expect(saved[saved.length - 1]).toEqual(DEFAULT_SETTINGS);
  });
});
