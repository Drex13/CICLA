// __tests__/presentation/viewmodels/fertilityPresentation.test.ts

import {
  bleedingLabel,
  fertilityColor,
  fertilityLabel,
  mucusLabel,
  NEUTRAL_COLOR,
} from '@viewmodels/fertilityPresentation';
import { ALL_CERVICAL_MUCUS } from '@domain/entities/CervicalMucus';
import type { FertilityPhase } from '@domain/entities/FertilityStatus';
import type { BleedingLevel } from '@domain/entities/CycleDay';

const ALL_PHASES: readonly FertilityPhase[] = [
  'menstruation',
  'dry_pre_ovulatory',
  'fertile_building',
  'peak_phase',
  'post_ovulatory_waiting',
  'post_ovulatory_infertile',
  'insufficient_data',
];

const ALL_BLEEDING_LEVELS: readonly BleedingLevel[] = [
  'light',
  'medium',
  'heavy',
];

describe('fertilityPresentation', () => {
  it('fertilityLabel/fertilityColor: tienen una entrada no vacía para cada fase', () => {
    for (const phase of ALL_PHASES) {
      expect(fertilityLabel(phase).length).toBeGreaterThan(0);
      expect(fertilityColor(phase)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('mucusLabel: tiene una entrada no vacía para cada tipo de moco', () => {
    for (const mucus of ALL_CERVICAL_MUCUS) {
      expect(mucusLabel(mucus).length).toBeGreaterThan(0);
    }
  });

  it('bleedingLabel: tiene una entrada no vacía para cada nivel de sangrado', () => {
    for (const level of ALL_BLEEDING_LEVELS) {
      expect(bleedingLabel(level).length).toBeGreaterThan(0);
    }
  });

  it('NEUTRAL_COLOR: es un color hexadecimal válido', () => {
    expect(NEUTRAL_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
