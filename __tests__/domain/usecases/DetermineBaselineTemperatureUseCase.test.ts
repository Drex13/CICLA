// __tests__/domain/usecases/DetermineBaselineTemperatureUseCase.test.ts

import { DetermineBaselineTemperatureUseCase } from '@domain/usecases/DetermineBaselineTemperatureUseCase';
import { buildTestCycleDays, type CycleDaySeed } from '../../helpers/factories';

const useCase = new DetermineBaselineTemperatureUseCase();

const lowThenRise: CycleDaySeed[] = [
  { dayNumber: 1, basalTemp: 36.3 },
  { dayNumber: 2, basalTemp: 36.35 },
  { dayNumber: 3, basalTemp: 36.3 },
  { dayNumber: 4, basalTemp: 36.4 },
  { dayNumber: 5, basalTemp: 36.35 },
  { dayNumber: 6, basalTemp: 36.45 },
  { dayNumber: 7, basalTemp: 36.4 },
  { dayNumber: 8, basalTemp: 36.4 },
  { dayNumber: 9, basalTemp: 36.7 }, // cambio térmico
  { dayNumber: 10, basalTemp: 36.8 },
  { dayNumber: 11, basalTemp: 36.9 },
];

describe('DetermineBaselineTemperatureUseCase', () => {
  it('LDC = MAX de las ≤6 temperaturas bajas previas al cambio térmico', () => {
    const result = useCase.execute({
      daysInCycle: buildTestCycleDays(lowThenRise),
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.coverline).toBeCloseTo(36.45, 5);
    expect(result.value.thermalShiftStartDayNumber).toBe(9);
    expect(result.value.isProvisional).toBe(false);
    expect(result.value.sampleDayNumbers).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('STM-008: una temperatura de fiebre (38.5 °C) se excluye de la LDC', () => {
    const withFever = lowThenRise.map((s) =>
      s.dayNumber === 5 ? { ...s, basalTemp: 38.5 } : s
    );
    const result = useCase.execute({
      daysInCycle: buildTestCycleDays(withFever),
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.coverline).toBeCloseTo(36.45, 5);
    expect(result.value.coverline).not.toBe(38.5);
    expect(result.value.sampleDayNumbers).not.toContain(5);
  });

  it('STM-010: los días sin temperatura se omiten sin romper el cálculo', () => {
    const withGaps = lowThenRise.map((s) => {
      if (s.dayNumber !== 4 && s.dayNumber !== 7) return s;
      const { basalTemp: _drop, ...rest } = s;
      return rest;
    });
    const result = useCase.execute({
      daysInCycle: buildTestCycleDays(withGaps),
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(typeof result.value.coverline).toBe('number');
    expect(result.value.thermalShiftStartDayNumber).toBe(9);
  });

  it('sin temperaturas válidas → Result de error', () => {
    const noTemps = buildTestCycleDays([
      { dayNumber: 1, mucusType: 'none' },
      { dayNumber: 2, mucusType: 'sticky' },
    ]);
    const result = useCase.execute({ daysInCycle: noTemps });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('sin cambio térmico → LDC provisional con las últimas temperaturas', () => {
    const result = useCase.execute({
      daysInCycle: buildTestCycleDays([
        { dayNumber: 1, basalTemp: 36.3 },
        { dayNumber: 2, basalTemp: 36.35 },
        { dayNumber: 3, basalTemp: 36.3 },
        { dayNumber: 4, basalTemp: 36.4 },
      ]),
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.isProvisional).toBe(true);
    expect(result.value.thermalShiftStartDayNumber).toBeNull();
  });

  it('asOfDayNumber recorta los días considerados', () => {
    const result = useCase.execute({
      daysInCycle: buildTestCycleDays(lowThenRise),
      asOfDayNumber: 6,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.isProvisional).toBe(true);
    expect(result.value.sampleDayNumbers.every((n) => n <= 6)).toBe(true);
  });
});
