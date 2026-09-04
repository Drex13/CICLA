// src/app/index.tsx
// Pantalla de inicio mínima (Fase 4, primer corte): solo confirma que la ruta
// raíz se conecta al cycleStore/settingsStore cableados en _layout.tsx. El
// diseño y los componentes atoms/molecules/organisms llegan en un paso posterior.

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useCycleStore, useSettingsStore } from '@stores/AppStoresContext';
import { selectHomeViewModel } from '@viewmodels/selectHomeViewModel';

export default function HomeScreen() {
  const cycle = useCycleStore((s) => s.cycle);
  const todayEntry = useCycleStore((s) => s.todayEntry);
  const fertilityStatus = useCycleStore((s) => s.fertilityStatus);
  const isLoading = useCycleStore((s) => s.isLoading);
  const error = useCycleStore((s) => s.error);
  const load = useCycleStore((s) => s.load);
  const userName = useSettingsStore((s) => s.userName);
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);

  useEffect(() => {
    void load();
  }, [load]);

  const data = selectHomeViewModel({
    state: { cycle, todayEntry, fertilityStatus, isLoading, error },
    settings: { userName, temperatureUnit },
    today: new Date(),
  });

  if (data.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Hola{data.userName ? `, ${data.userName}` : ''}
      </Text>
      <Text style={[styles.fertility, { color: data.fertilityColor }]}>
        {data.fertilityLabel}
      </Text>
      <Text style={styles.message}>{data.fertilityMessage}</Text>
      <Text style={styles.dayNumber}>Día {data.currentCycleDay} del ciclo</Text>
      {data.error !== null ? (
        <Text style={styles.error}>{data.error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  fertility: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
  },
  dayNumber: {
    fontSize: 14,
    opacity: 0.7,
  },
  error: {
    fontSize: 14,
    color: '#C2185B',
    marginTop: 16,
  },
});
