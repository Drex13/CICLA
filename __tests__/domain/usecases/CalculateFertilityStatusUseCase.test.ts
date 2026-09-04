// __tests__/domain/usecases/CalculateFertilityStatusUseCase.test.ts
// Casos obligatorios del algoritmo STM (doc §5.3): STM-001 … STM-010,
// más los dos ejemplos literales del doc §11.2.

import type { CycleDay } from '@domain/entities/CycleDay';
import { CalculateFertilityStatusUseCase } from '@domain/usecases/CalculateFertilityStatusUseCase';
import { STM } from '@shared/constants/stmConstants';
import {
  buildPreviousCycles,
  buildTestCycleDays,
  type CycleDaySeed,
} from '../../helpers/factories';

const useCase = new CalculateFertilityStatusUseCase();
const threePreviousCycles = buildPreviousCycles(3);

/** Ciclo ovulatorio canónico: LDC = 36.5, triple térmico confirmado el día 15,
 *  Peak Day el día 12, regla del moco el día 15. */
const canonicalSeeds: CycleDaySeed[] = [
  { dayNumber: 1, basalTemp: 36.3, mucusType: 'none', bleedingLevel: 'medium' },
  {
    dayNumber: 2,
    basalTemp: 36.35,
    mucusType: 'none',
    bleedingLevel: 'medium',
  },
  { dayNumber: 3, basalTemp: 36.3, mucusType: 'none', bleedingLevel: 'light' },
  { dayNumber: 4, basalTemp: 36.4, mucusType: 'none', bleedingLevel: 'light' },
  { dayNumber: 5, basalTemp: 36.35, mucusType: 'none' },
  { dayNumber: 6, basalTemp: 36.35, mucusType: 'sticky' },
  { dayNumber: 7, basalTemp: 36.3, mucusType: 'sticky' },
  { dayNumber: 8, basalTemp: 36.4, mucusType: 'creamy' },
  { dayNumber: 9, basalTemp: 36.35, mucusType: 'creamy' },
  { dayNumber: 10, basalTemp: 36.4, mucusType: 'egg_white' },
  { dayNumber: 11, basalTemp: 36.45, mucusType: 'egg_white' },
  { dayNumber: 12, basalTemp: 36.5, mucusType: 'egg_white' }, // último egg_white → Peak
  { dayNumber: 13, basalTemp: 36.75, mucusType: 'sticky' }, // alta 1
  { dayNumber: 14, basalTemp: 36.8, mucusType: 'none' }, // alta 2
  { dayNumber: 15, basalTemp: 36.95, mucusType: 'none' }, // alta 3 (≥ LDC+0.4)
  { dayNumber: 16, basalTemp: 36.9, mucusType: 'none' },
  { dayNumber: 17, basalTemp: 36.9, mucusType: 'none' },
];

const dayOf = (days: CycleDay[], n: number): CycleDay => {
  const found = days.find((d) => d.dayNumber === n);
  if (found === undefined)
    throw new Error(`No hay día ${n} en el ciclo de prueba`);
  return found;
};

describe('CalculateFertilityStatusUseCase — casos obligatorios STM', () => {
  it('STM-001: menos de 3 ciclos completos → insufficient_data', () => {
    const days = buildTestCycleDays(canonicalSeeds);
    const result = useCase.execute({
      currentDay: dayOf(days, 8),
      allDaysInCycle: days,
      previousCycles: buildPreviousCycles(2),
    });
    expect(result.phase).toBe('insufficient_data');
    expect(result.confidence).toBe('insufficient');
  });

  it('STM-002: bleedingLevel presente → menstruation, ventana fértil', () => {
    const days = buildTestCycleDays(canonicalSeeds);
    const result = useCase.execute({
      currentDay: dayOf(days, 2),
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    expect(result.phase).toBe('menstruation');
    expect(result.isFertileWindow).toBe(true);
  });

  it('STM-003: triple térmico confirmado → thermicRuleDay = 3er día alto', () => {
    const days = buildTestCycleDays(canonicalSeeds);
    const result = useCase.execute({
      currentDay: dayOf(days, 15),
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    expect(result.thermicRuleDay).toBe(15);
  });

  it('STM-004: triple térmico roto (alta, baja, alta, alta) → no se activa', () => {
    const days = buildTestCycleDays([
      { dayNumber: 13, basalTemp: 36.7, mucusType: 'sticky' },
      { dayNumber: 14, basalTemp: 36.4, mucusType: 'none' }, // rompe la racha
      { dayNumber: 15, basalTemp: 36.8, mucusType: 'none' },
      { dayNumber: 16, basalTemp: 36.9, mucusType: 'none' },
    ]);
    const result = useCase.execute({
      currentDay: dayOf(days, 16),
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    expect(result.thermicRuleDay).toBeUndefined();
    expect(result.phase).not.toBe('post_ovulatory_infertile');
  });

  it('STM-006: regla del moco 4 días post-Peak → se cumple; en Peak+3 aún no', () => {
    const days = buildTestCycleDays(canonicalSeeds);

    const atPeakPlus3 = useCase.execute({
      currentDay: dayOf(days, 15), // Peak(12) + 3
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    expect(atPeakPlus3.phase).not.toBe('post_ovulatory_infertile');

    const atPeakPlus4 = useCase.execute({
      currentDay: dayOf(days, 16), // Peak(12) + 4
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    expect(atPeakPlus4.mucusRuleDay).toBe(12 + STM.POST_PEAK_DAYS);
    expect(atPeakPlus4.phase).toBe('post_ovulatory_infertile');
  });

  it('STM-007: ambas reglas cumplidas → post_ovulatory_infertile, confirmed', () => {
    const days = buildTestCycleDays(canonicalSeeds);
    const result = useCase.execute({
      currentDay: dayOf(days, 17),
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    expect(result.phase).toBe('post_ovulatory_infertile');
    expect(result.confidence).toBe('confirmed');
    expect(result.isFertileWindow).toBe(false);
  });

  it('STM-008: fiebre (38.5 °C) en día preovulatorio no altera la regla térmica', () => {
    const feverSeeds = canonicalSeeds.map((s) =>
      s.dayNumber === 8 ? { ...s, basalTemp: 38.5 } : s
    );
    const days = buildTestCycleDays(feverSeeds);
    const result = useCase.execute({
      currentDay: dayOf(days, 15),
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    // La LDC y el triple térmico se mantienen igual que sin fiebre.
    expect(result.thermicRuleDay).toBe(15);
  });

  it('STM-009: ciclo corto (18 días) se maneja sin crash', () => {
    const shortSeeds: CycleDaySeed[] = Array.from({ length: 18 }, (_u, i) => ({
      dayNumber: i + 1,
      basalTemp: 36.4,
      mucusType: 'none' as const,
    }));
    const days = buildTestCycleDays(shortSeeds);
    const knownPhases = [
      'menstruation',
      'dry_pre_ovulatory',
      'fertile_building',
      'peak_phase',
      'post_ovulatory_waiting',
      'post_ovulatory_infertile',
      'insufficient_data',
    ];
    expect(() => {
      const result = useCase.execute({
        currentDay: dayOf(days, 18),
        allDaysInCycle: days,
        previousCycles: threePreviousCycles,
      });
      expect(knownPhases).toContain(result.phase);
    }).not.toThrow();
  });

  it('STM-010: un día sin temperatura se omite; la regla térmica sigue activándose', () => {
    const gapSeeds = canonicalSeeds.map((s) => {
      if (s.dayNumber !== 14) return s;
      const { basalTemp: _drop, ...rest } = s;
      return rest;
    });
    const days = buildTestCycleDays(gapSeeds);
    const result = useCase.execute({
      currentDay: dayOf(days, 17),
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    expect(result.thermicRuleDay).not.toBeUndefined();
    expect(result.phase).toBe('post_ovulatory_infertile');
  });
});

describe('CalculateFertilityStatusUseCase — ejemplos literales del doc §11.2', () => {
  it('confirma ovulación con 3 temperaturas consecutivas correctas', () => {
    const days = buildTestCycleDays([
      { dayNumber: 1, basalTemp: 36.4, mucusType: 'none' },
      { dayNumber: 8, basalTemp: 36.3, mucusType: 'creamy' },
      {
        dayNumber: 12,
        basalTemp: 36.5,
        mucusType: 'egg_white',
        isPeakDay: true,
      },
      { dayNumber: 13, basalTemp: 36.7, mucusType: 'sticky' },
      { dayNumber: 14, basalTemp: 36.8, mucusType: 'none' },
      { dayNumber: 15, basalTemp: 36.9, mucusType: 'none' },
    ]);
    const result = useCase.execute({
      currentDay: days[5] as CycleDay,
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    expect(result.thermicRuleDay).toBe(15);
  });

  it('NO confirma si los 3 días altos no son consecutivos', () => {
    const days = buildTestCycleDays([
      { dayNumber: 13, basalTemp: 36.7, mucusType: 'sticky' },
      { dayNumber: 14, basalTemp: 36.4, mucusType: 'none' },
      { dayNumber: 15, basalTemp: 36.8, mucusType: 'none' },
      { dayNumber: 16, basalTemp: 36.9, mucusType: 'none' },
    ]);
    const result = useCase.execute({
      currentDay: days[3] as CycleDay,
      allDaysInCycle: days,
      previousCycles: threePreviousCycles,
    });
    expect(result.thermicRuleDay).toBeUndefined();
    expect(result.phase).not.toBe('post_ovulatory_infertile');
  });
});
