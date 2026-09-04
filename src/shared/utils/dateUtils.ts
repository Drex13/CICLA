// src/shared/utils/dateUtils.ts
// Utilidades de fecha puras, sin lógica de negocio (zona neutral @shared).
// Todo el cálculo del STM razona en "días civiles" (ignora horas/zonas).

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Medianoche local del día de `d`, como Date. */
export const startOfCivilDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Timestamp UTC del día civil de `d` (para restas estables). */
export const civilDayTimestamp = (d: Date): number =>
  Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Diferencia en días civiles: `to - from`.
 * Mismo día → 0; día siguiente → 1; día anterior → -1.
 */
export const daysBetweenCivil = (from: Date, to: Date): number =>
  Math.round((civilDayTimestamp(to) - civilDayTimestamp(from)) / MS_PER_DAY);

/** `true` si `a` y `b` caen en el mismo día civil. */
export const isSameCivilDay = (a: Date, b: Date): boolean =>
  civilDayTimestamp(a) === civilDayTimestamp(b);

/** Devuelve `d` desplazada `n` días (n puede ser negativo). */
export const addCivilDays = (d: Date, n: number): Date => {
  const copy = startOfCivilDay(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};
