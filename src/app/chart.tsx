// src/app/chart.tsx
// Gráfica del ciclo (Fase 4, primer corte): temperatura basal + LDC (Línea de
// Cobertura) + Peak Day, con react-native-gifted-charts. Solo se grafican los
// días con temperatura registrada; ejes, tooltips y leyenda completa llegan
// después junto con los componentes atoms/molecules.

import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart, type lineDataItem } from 'react-native-gifted-charts';
import { useCycleStore, useSettingsStore } from '@stores/AppStoresContext';
import { selectCycleChartViewModel } from '@viewmodels/selectCycleChartViewModel';

const LINE_COLOR = '#43A047';
const PEAK_COLOR = '#E53935';
const COVERLINE_COLOR = '#9E9E9E';

export default function CycleChartScreen() {
  const daysInCycle = useCycleStore((s) => s.daysInCycle);
  const baseline = useCycleStore((s) => s.baseline);
  const peakDayNumber = useCycleStore((s) => s.peakDayNumber);
  const isLoading = useCycleStore((s) => s.isLoading);
  const load = useCycleStore((s) => s.load);
  const unit = useSettingsStore((s) => s.temperatureUnit);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const data = selectCycleChartViewModel({
    daysInCycle,
    baseline,
    peakDayNumber,
    unit,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data.hasEnoughData) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          Aún no hay temperaturas registradas en este ciclo.
        </Text>
      </View>
    );
  }

  const recordedPoints = data.points.filter(
    (p): p is typeof p & { temperatureCelsius: number } =>
      p.temperatureCelsius !== null
  );

  const chartData: lineDataItem[] = recordedPoints.map((p) => ({
    value: p.temperatureCelsius,
    label: String(p.dayNumber),
    dataPointColor: p.isPeakDay ? PEAK_COLOR : LINE_COLOR,
  }));

  const coverline = data.coverlineCelsius;
  const coverlineData: lineDataItem[] | undefined =
    coverline === null
      ? undefined
      : recordedPoints.map(() => ({ value: coverline, hideDataPoint: true }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gráfica del ciclo</Text>
      <LineChart
        data={chartData}
        {...(coverlineData !== undefined ? { data2: coverlineData } : {})}
        color1={LINE_COLOR}
        color2={COVERLINE_COLOR}
        thickness1={2}
        thickness2={1}
        strokeDashArray2={[6, 4]}
        dataPointsRadius={4}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        noOfSections={5}
        spacing={36}
        initialSpacing={16}
        height={220}
      />
      {data.coverlineLabel !== null ? (
        <Text style={styles.legend}>LDC: {data.coverlineLabel}</Text>
      ) : null}
      {data.peakDayNumber !== null ? (
        <Text style={styles.legend}>Peak Day: día {data.peakDayNumber}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  axisText: {
    fontSize: 10,
    color: '#666666',
  },
  legend: {
    fontSize: 14,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});
