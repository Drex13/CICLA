// src/shared/utils/dateUtils.ts
// Utilidades de fecha puras, sin lógica de negocio (zona neutral @shared).
// Todo el cálculo del STM razona en "días civiles" (ignora horas/zonas).

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Medianoche local del día de `d`, como Date. */
export const startOfCivilDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Timestamp UTC del día civil de `d` (para restas estables entre fechas). */
export const civilDayTimestamp = (d: Date): number =>
  Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Clave de persistencia de un día: ms de la medianoche LOCAL de `d`.
 * Se usa como identidad de fecha en la DB, de modo que al releer `new Date(key)`
 * se obtiene el mismo día del calendario en la zona del dispositivo.
 */
export const civilDayKey = (d: Date): number => startOfCivilDay(d).getTime();

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

/** 'YYYY-MM-DD' del día civil local de `d` (independiente de la zona). */
export const formatIsoDate = (d: Date): string => {
  const y = d.getFullYear().toString().padStart(4, '0');
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};
