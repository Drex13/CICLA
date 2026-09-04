// src/domain/entities/CervicalMucus.ts
// Observación del moco cervical, ordenada de menor a mayor fertilidad.
// El ranking numérico vive en @shared/constants/stmConstants (MUCUS_FERTILITY_RANK).

export type CervicalMucus =
  | 'none' // Sin moco / Seco
  | 'sticky' // Pastoso / Pegajoso
  | 'creamy' // Cremoso / Lechoso
  | 'watery' // Acuoso / Elástico
  | 'egg_white'; // Clara de huevo (máxima fertilidad)

export const ALL_CERVICAL_MUCUS: readonly CervicalMucus[] = [
  'none',
  'sticky',
  'creamy',
  'watery',
  'egg_white',
] as const;
