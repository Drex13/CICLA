// src/app/settings.tsx
// Ajustes (Fase 4, primer corte): nombre y unidad de temperatura. Sin
// persistencia todavía -- SecureStore/AsyncStorage y el recordatorio diario
// llegan en Fase 5 (ver el comentario de settingsStore.ts).

import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@stores/AppStoresContext';

export default function SettingsScreen() {
  const userName = useSettingsStore((s) => s.userName);
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const setUserName = useSettingsStore((s) => s.setUserName);
  const setTemperatureUnit = useSettingsStore((s) => s.setTemperatureUnit);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>

      <Text style={styles.label}>Tu nombre</Text>
      <TextInput
        style={styles.input}
        value={userName}
        onChangeText={setUserName}
        placeholder="¿Cómo te llamas?"
      />

      <Text style={styles.label}>Unidad de temperatura</Text>
      <View style={styles.optionRow}>
        <Pressable
          style={[
            styles.option,
            temperatureUnit === 'celsius' && styles.optionSelected,
          ]}
          onPress={() => setTemperatureUnit('celsius')}
        >
          <Text style={styles.optionText}>Celsius (°C)</Text>
        </Pressable>
        <Pressable
          style={[
            styles.option,
            temperatureUnit === 'fahrenheit' && styles.optionSelected,
          ]}
          onPress={() => setTemperatureUnit('fahrenheit')}
        >
          <Text style={styles.optionText}>Fahrenheit (°F)</Text>
        </Pressable>
      </View>

      <Pressable style={styles.doneButton} onPress={() => router.back()}>
        <Text style={styles.doneButtonText}>Listo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  optionSelected: {
    borderColor: '#43A047',
    backgroundColor: '#E8F5E9',
  },
  optionText: {
    fontSize: 14,
  },
  doneButton: {
    marginTop: 32,
    backgroundColor: '#43A047',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
