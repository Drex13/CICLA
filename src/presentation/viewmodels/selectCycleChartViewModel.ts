// src/presentation/viewmodels/selectCycleChartViewModel.ts
// Transforma los días del ciclo en datos de gráfica (temperatura + LDC + Peak).
// El componente de Fase 4 mapea esto a props de react-native-gifted-charts.

import type { CycleDay } from '@domain/entities/CycleDay';
import type { BaselineTemperature } from '@domain/usecases/DetermineBaselineTemperatureUseCase';
import {
  formatTemperature,
  type TemperatureUnit,
} from '@shared/utils/temperatureUtils';

export interface CycleChartPoint {
  readonly dayNumber: number;
  readonly temperatureCelsius: number | null;
  readonly temperatureLabel: string;
  readonly isPeakDay: boolean;
  readonly mucusType: CycleDay['mucusType'];
}

export interface CycleChartViewModelData {
  readonly points: readonly CycleChartPoint[];
  readonly coverlineCelsius: number | null;
  readonly coverlineLabel: string | null;
  readonly thermicShiftDayNumber: number | null;
  readonly peakDayNumber: number | null;
  readonly unit: TemperatureUnit;
  readonly hasEnoughData: boolean;
}

export const selectCycleChartViewModel = (input: {
  daysInCycle: readonly CycleDay[];
  baseline: BaselineTemperature | null;
  peakDayNumber: number | null;
  unit: TemperatureUnit;
}): CycleChartViewModelData => {
  const { daysInCycle, baseline, peakDayNumber, unit } = input;

  const points: CycleChartPoint[] = [...daysInCycle]
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((d) => ({
      dayNumber: d.dayNumber,
      temperatureCelsius: d.basalTemp ?? null,
      temperatureLabel: formatTemperature(d.basalTemp, unit),
      isPeakDay: d.isPeakDay,
      mucusType: d.mucusType,
    }));

  const coverlineCelsius = baseline ? baseline.coverline : null;

  return {
    points,
    coverlineCelsius,
    coverlineLabel:
      coverlineCelsius === null
        ? null
        : formatTemperature(coverlineCelsius, unit),
    thermicShiftDayNumber: baseline
      ? baseline.thermalShiftStartDayNumber
      : null,
    peakDayNumber,
    unit,
    hasEnoughData: points.some((p) => p.temperatureCelsius !== null),
  };
};
