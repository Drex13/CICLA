// src/shared/constants/stmConstants.ts
// Toda constante del Método Sintotérmico vive aquí. Nunca inline (regla R09).
//
// USO CORRECTO:   if (temp >= ldc + STM.TEMP_RISE_THRESHOLD)
// USO INCORRECTO: if (temp >= ldc + 0.2)   ← número mágico

import type { CervicalMucus } from '@domain/entities/CervicalMucus';

export const STM = {
  // ─── Regla térmica ────────────────────────────────────────────────
  /** °C sobre la LDC para considerar una temperatura "alta". */
  TEMP_RISE_THRESHOLD: 0.2,
  /** °C sobre la LDC exigidos al 3er día del triple térmico. */
  TEMP_CONFIRMED_THRESHOLD: 0.4,
  /** Días consecutivos altos para confirmar el cambio térmico. */
  CONSECUTIVE_HIGH_DAYS: 3,
  /** Nº de temperaturas bajas preovulatorias para calcular la LDC. */
  LDC_SAMPLE_SIZE: 6,
  /** Mínimo de temperaturas base antes de aceptar un candidato a cambio térmico. */
  MIN_LDC_SAMPLE_SIZE: 2,

  // ─── Regla del moco ───────────────────────────────────────────────
  /** Días post-Peak con moco decreciente para confirmar la regla. */
  POST_PEAK_DAYS: 3,

  // ─── Validación de datos ──────────────────────────────────────────
  /** °C — límite inferior "normal". Por debajo, probable error de medición. */
  MIN_BASAL_TEMP_C: 35.0,
  /** °C — límite superior "normal". Por encima se trata como fiebre. */
  MAX_BASAL_TEMP_C: 37.8,
  /**
   * °C — rango fisiológico absoluto aceptado al REGISTRAR un día.
   * Fuera de [ABSOLUTE_MIN, ABSOLUTE_MAX] el input se rechaza. Dentro, se
   * guarda; el rango "normal" [MIN, MAX] solo lo usa el cálculo STM para
   * excluir fiebre de la LDC (resuelve la tensión doc §2.3 flujo ↔ STM-008).
   */
  ABSOLUTE_MIN_BASAL_TEMP_C: 34.0,
  ABSOLUTE_MAX_BASAL_TEMP_C: 42.0,
  /** Ciclos más cortos son atípicos: se registran pero se advierte. */
  MIN_CYCLE_LENGTH_DAYS: 18,
  /** Ciclos más largos son atípicos: se registran pero se advierte. */
  MAX_CYCLE_LENGTH_DAYS: 45,

  // ─── Datos mínimos para calcular ──────────────────────────────────
  /** Ciclos completos necesarios antes de emitir un pronóstico. */
  MIN_CYCLES_FOR_CALCULATION: 3,
} as const;

/**
 * Jerarquía de fertilidad del moco cervical, de menor a mayor.
 * Se usa para detectar el Peak Day y la regla del moco decreciente.
 * (Extensión sobre el documento: necesaria para "mucosidad decreciente"
 *  sin números mágicos — regla R09.)
 */
export const MUCUS_FERTILITY_RANK: Readonly<Record<CervicalMucus, number>> = {
  none: 0,
  sticky: 1,
  creamy: 2,
  watery: 3,
  egg_white: 4,
} as const;

/** Tipos de moco que abren ventana fértil por sí solos. */
export const FERTILE_MUCUS_TYPES: readonly CervicalMucus[] = [
  'creamy',
  'watery',
  'egg_white',
] as const;

/** Tipos de moco que marcan el pico de fertilidad (candidatos a Peak Day). */
export const PEAK_MUCUS_TYPES: readonly CervicalMucus[] = [
  'watery',
  'egg_white',
] as const;
