// src/presentation/viewmodels/fertilityPresentation.ts
// Mapeos de presentación puros: enums del dominio → texto y color para la UI.
// (Los colores migrarán a shared/constants/theme.ts en Fase 4.)

import type { CervicalMucus } from '@domain/entities/CervicalMucus';
import type { BleedingLevel } from '@domain/entities/CycleDay';
import type { FertilityPhase } from '@domain/entities/FertilityStatus';

const PHASE_LABEL: Record<FertilityPhase, string> = {
  menstruation: 'Menstruación',
  dry_pre_ovulatory: 'Infértil',
  fertile_building: 'Fértil',
  peak_phase: 'Muy fértil',
  post_ovulatory_waiting: 'En observación',
  post_ovulatory_infertile: 'Infértil',
  insufficient_data: 'Sin datos suficientes',
};

const PHASE_COLOR: Record<FertilityPhase, string> = {
  menstruation: '#C2185B',
  dry_pre_ovulatory: '#43A047',
  fertile_building: '#FFB300',
  peak_phase: '#E53935',
  post_ovulatory_waiting: '#FB8C00',
  post_ovulatory_infertile: '#43A047',
  insufficient_data: '#9E9E9E',
};

const MUCUS_LABEL: Record<CervicalMucus, string> = {
  none: 'Sin moco / seco',
  sticky: 'Pegajoso',
  creamy: 'Cremoso',
  watery: 'Acuoso',
  egg_white: 'Clara de huevo',
};

const BLEEDING_LABEL: Record<BleedingLevel, string> = {
  light: 'Leve',
  medium: 'Moderado',
  heavy: 'Abundante',
};

export const fertilityLabel = (phase: FertilityPhase): string =>
  PHASE_LABEL[phase];

export const fertilityColor = (phase: FertilityPhase): string =>
  PHASE_COLOR[phase];

export const mucusLabel = (mucus: CervicalMucus): string => MUCUS_LABEL[mucus];

export const bleedingLabel = (level: BleedingLevel): string =>
  BLEEDING_LABEL[level];

export const NEUTRAL_COLOR = '#9E9E9E';
