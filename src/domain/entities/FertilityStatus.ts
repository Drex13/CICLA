// src/domain/entities/FertilityStatus.ts
// Resultado del algoritmo STM para un día concreto. Dato inmutable de salida
// de CalculateFertilityStatusUseCase — sin lógica, solo el veredicto.

export type FertilityPhase =
  | 'menstruation' // Días de regla
  | 'dry_pre_ovulatory' // Días secos antes de la ovulación
  | 'fertile_building' // Moco presente, ovulación aún no confirmada
  | 'peak_phase' // Fase de Peak (máxima fertilidad)
  | 'post_ovulatory_waiting' // Esperando confirmación (térmica o moco)
  | 'post_ovulatory_infertile' // Infertilidad post-ovulatoria confirmada
  | 'insufficient_data'; // Menos de 3 ciclos completos

export type ConfidenceLevel = 'confirmed' | 'probable' | 'insufficient';

export interface FertilityStatus {
  readonly phase: FertilityPhase;
  readonly confidence: ConfidenceLevel;
  readonly isFertileWindow: boolean;
  /** Mensaje corto para mostrar a la usuaria. */
  readonly message: string;
  /** Explicación de qué regla se aplicó (para la vista de detalle). */
  readonly detail: string;
  /** Día del ciclo en que se cumplió la regla térmica (si se cumplió). */
  readonly thermicRuleDay?: number;
  /** Día del ciclo en que se cumplió la regla del moco (si se cumplió). */
  readonly mucusRuleDay?: number;
}
