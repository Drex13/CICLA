// src/app/index.tsx
// Pantalla de inicio (Fase 4): fertilidad de hoy + acciones para iniciar un
// ciclo o registrar el día. Se recarga cada vez que la ruta gana foco (p.ej.
// al volver de /log-entry) para reflejar lo recién guardado.

import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCycleStore, useSettingsStore } from '@stores/AppStoresContext';
import { selectHomeViewModel } from '@viewmodels/selectHomeViewModel';

export default function HomeScreen() {
  const cycle = useCycleStore((s) => s.cycle);
  const todayEntry = useCycleStore((s) => s.todayEntry);
  const fertilityStatus = useCycleStore((s) => s.fertilityStatus);
  const isLoading = useCycleStore((s) => s.isLoading);
  const error = useCycleStore((s) => s.error);
  const load = useCycleStore((s) => s.load);
  const startNewCycle = useCycleStore((s) => s.startNewCycle);
  const userName = useSettingsStore((s) => s.userName);
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

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
      <View style={styles.topRow}>
        <Text style={styles.greeting}>
          Hola{data.userName ? `, ${data.userName}` : ''}
        </Text>
        <Pressable onPress={() => router.push('/settings')}>
          <Text style={styles.settingsLink}>Ajustes</Text>
        </Pressable>
      </View>
      <Text style={[styles.fertility, { color: data.fertilityColor }]}>
        {data.fertilityLabel}
      </Text>
      <Text style={styles.message}>{data.fertilityMessage}</Text>
      {cycle !== null ? (
        <Text style={styles.dayNumber}>
          Día {data.currentCycleDay} del ciclo
        </Text>
      ) : null}
      {data.error !== null ? (
        <Text style={styles.error}>{data.error}</Text>
      ) : null}

      {cycle === null ? (
        <Pressable
          style={styles.button}
          onPress={() => void startNewCycle(new Date())}
        >
          <Text style={styles.buttonText}>Comenzar ciclo</Text>
        </Pressable>
      ) : (
        <>
          <Pressable
            style={styles.button}
            onPress={() => router.push('/log-entry')}
          >
            <Text style={styles.buttonText}>
              {data.hasTodayEntry ? 'Editar registro de hoy' : 'Registrar hoy'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/chart')}
          >
            <Text style={styles.secondaryButtonText}>Ver gráfica</Text>
          </Pressable>
        </>
      )}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
  },
  settingsLink: {
    fontSize: 14,
    color: '#43A047',
    fontWeight: '600',
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
  button: {
    marginTop: 24,
    backgroundColor: '#43A047',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#43A047',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#43A047',
    fontSize: 16,
    fontWeight: '600',
  },
});
