// __tests__/presentation/viewmodels/selectCycleChartViewModel.test.ts

import { selectCycleChartViewModel } from '@viewmodels/selectCycleChartViewModel';
import { buildTestCycleDays } from '../../helpers/factories';

describe('selectCycleChartViewModel', () => {
  it('sin días: no hay datos suficientes y no hay LDC', () => {
    const data = selectCycleChartViewModel({
      daysInCycle: [],
      baseline: null,
      peakDayNumber: null,
      unit: 'celsius',
    });

    expect(data.points).toEqual([]);
    expect(data.hasEnoughData).toBe(false);
    expect(data.coverlineCelsius).toBeNull();
    expect(data.coverlineLabel).toBeNull();
  });

  it('ordena los puntos por dayNumber y formatea la temperatura en la unidad dada', () => {
    const days = buildTestCycleDays([
      { dayNumber: 3, basalTemp: 36.6, mucusType: 'creamy' },
      { dayNumber: 1, basalTemp: 36.4, mucusType: 'none' },
      { dayNumber: 2, mucusType: 'none' }, // sin temperatura
    ]);

    const data = selectCycleChartViewModel({
      daysInCycle: days,
      baseline: null,
      peakDayNumber: null,
      unit: 'fahrenheit',
    });

    expect(data.points.map((p) => p.dayNumber)).toEqual([1, 2, 3]);
    expect(data.points[1]?.temperatureCelsius).toBeNull();
    expect(data.points[1]?.temperatureLabel).toBe('—');
    expect(data.points[0]?.temperatureLabel).toMatch(/°F$/);
    expect(data.hasEnoughData).toBe(true);
  });

  it('con baseline: expone la LDC formateada y el día de cambio térmico', () => {
    const data = selectCycleChartViewModel({
      daysInCycle: [],
      baseline: {
        coverline: 36.4,
        sampleDayNumbers: [1, 2, 3],
        thermalShiftStartDayNumber: 12,
        isProvisional: false,
      },
      peakDayNumber: 10,
      unit: 'celsius',
    });

    expect(data.coverlineCelsius).toBe(36.4);
    expect(data.coverlineLabel).toBe('36.40 °C');
    expect(data.thermicShiftDayNumber).toBe(12);
    expect(data.peakDayNumber).toBe(10);
  });
});
