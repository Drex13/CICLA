// src/app/_layout.tsx
// Composition root de la app (Fase 4). Único archivo que cablea las cuatro
// capas: abre la base de datos, construye los repos Drizzle, los UseCases del
// dominio y los stores de presentación, y los expone al árbol de rutas vía
// AppStoresContext. Ninguna pantalla instancia UseCases ni repos directamente.

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDatabaseContext } from '@data/database/client';
import { DrizzleCycleDayRepository } from '@data/repositories/DrizzleCycleDayRepository';
import { DrizzleCycleRepository } from '@data/repositories/DrizzleCycleRepository';
import { AnalyzeCurrentCycleUseCase } from '@domain/usecases/AnalyzeCurrentCycleUseCase';
import { GetCurrentCycleUseCase } from '@domain/usecases/GetCurrentCycleUseCase';
import { LogDailyEntryUseCase } from '@domain/usecases/LogDailyEntryUseCase';
import { StartNewCycleUseCase } from '@domain/usecases/StartNewCycleUseCase';
import { createAppStores, type AppStores } from '@stores/createAppStores';
import { AppStoresContext } from '@stores/AppStoresContext';

export default function RootLayout() {
  const [stores, setStores] = useState<AppStores | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDatabaseContext()
      .then(({ db, changeBus }) => {
        if (cancelled) return;
        const cycleRepository = new DrizzleCycleRepository(db, changeBus);
        const cycleDayRepository = new DrizzleCycleDayRepository(db, changeBus);

        setStores(
          createAppStores({
            getCurrentCycle: new GetCurrentCycleUseCase(
              cycleRepository,
              cycleDayRepository
            ),
            analyzeCurrentCycle: new AnalyzeCurrentCycleUseCase(
              cycleRepository,
              cycleDayRepository
            ),
            startNewCycle: new StartNewCycleUseCase(cycleRepository),
            logDailyEntry: new LogDailyEntryUseCase(
              cycleRepository,
              cycleDayRepository
            ),
          })
        );
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(String(cause));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error !== null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          No se pudo abrir la base de datos.
        </Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  if (stores === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AppStoresContext.Provider value={stores}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppStoresContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});
