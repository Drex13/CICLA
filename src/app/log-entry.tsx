// src/app/log-entry.tsx
// Formulario de registro diario (Fase 4, primer corte): temperatura, moco,
// sangrado, Peak Day y notas. UI mínima con componentes nativos; el diseño
// final (atoms/molecules) llega en un paso posterior.

import { useCallback, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  useCycleStore,
  useLogEntryStore,
  useSettingsStore,
} from '@stores/AppStoresContext';
import { selectLogEntryViewModel } from '@viewmodels/selectLogEntryViewModel';

export default function LogEntryScreen() {
  const todayEntry = useCycleStore((s) => s.todayEntry);
  const reloadCycle = useCycleStore((s) => s.load);
  const unit = useSettingsStore((s) => s.temperatureUnit);

  const date = useLogEntryStore((s) => s.date);
  const basalTempInput = useLogEntryStore((s) => s.basalTempInput);
  const mucusType = useLogEntryStore((s) => s.mucusType);
  const bleedingLevel = useLogEntryStore((s) => s.bleedingLevel);
  const isPeakDay = useLogEntryStore((s) => s.isPeakDay);
  const notes = useLogEntryStore((s) => s.notes);
  const isSubmitting = useLogEntryStore((s) => s.isSubmitting);
  const formError = useLogEntryStore((s) => s.formError);
  const domainError = useLogEntryStore((s) => s.domainError);
  const setBasalTempInput = useLogEntryStore((s) => s.setBasalTempInput);
  const setMucusType = useLogEntryStore((s) => s.setMucusType);
  const setBleedingLevel = useLogEntryStore((s) => s.setBleedingLevel);
  const setIsPeakDay = useLogEntryStore((s) => s.setIsPeakDay);
  const setNotes = useLogEntryStore((s) => s.setNotes);
  const loadFrom = useLogEntryStore((s) => s.loadFrom);
  const reset = useLogEntryStore((s) => s.reset);
  const submit = useLogEntryStore((s) => s.submit);

  useEffect(() => {
    if (todayEntry !== null) loadFrom(todayEntry, unit);
    else reset(new Date());
    // Solo al entrar a la pantalla: precargar el registro de hoy si existe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = selectLogEntryViewModel({
    state: {
      date,
      basalTempInput,
      mucusType,
      bleedingLevel,
      isPeakDay,
      notes,
      isSubmitting,
      formError,
      domainError,
    },
    unit,
  });

  const handleSubmit = useCallback(async () => {
    const result = await submit(unit);
    if (result?.success === true) {
      await reloadCycle();
      router.back();
    }
  }, [submit, unit, reloadCycle]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro de {data.dateLabel}</Text>

      <Text style={styles.label}>Temperatura basal</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder={data.basalTempPlaceholder}
        value={data.basalTempInput}
        onChangeText={setBasalTempInput}
      />

      <Text style={styles.label}>Moco cervical</Text>
      <View style={styles.optionRow}>
        {data.mucusOptions.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              data.mucusType === option.value && styles.optionSelected,
            ]}
            onPress={() => setMucusType(option.value)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Sangrado</Text>
      <View style={styles.optionRow}>
        <Pressable
          style={[
            styles.option,
            data.bleedingLevel === null && styles.optionSelected,
          ]}
          onPress={() => setBleedingLevel(null)}
        >
          <Text style={styles.optionText}>Ninguno</Text>
        </Pressable>
        {data.bleedingOptions.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              data.bleedingLevel === option.value && styles.optionSelected,
            ]}
            onPress={() => setBleedingLevel(option.value)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Marcar como Peak Day</Text>
        <Switch value={data.isPeakDay} onValueChange={setIsPeakDay} />
      </View>

      <Text style={styles.label}>Notas</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        multiline
        value={data.notes}
        onChangeText={setNotes}
      />

      {data.error !== null ? (
        <Text style={styles.error}>{data.error}</Text>
      ) : null}

      <Pressable
        style={[
          styles.submitButton,
          !data.canSubmit && styles.submitButtonDisabled,
        ]}
        disabled={!data.canSubmit}
        onPress={() => void handleSubmit()}
      >
        <Text style={styles.submitButtonText}>
          {data.isSubmitting ? 'Guardando…' : 'Guardar'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  error: {
    fontSize: 14,
    color: '#C2185B',
    marginTop: 16,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#43A047',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
