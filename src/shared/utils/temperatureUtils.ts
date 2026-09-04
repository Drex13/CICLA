// src/shared/utils/temperatureUtils.ts
// Conversión y formateo de temperatura para presentación. Sin lógica de negocio:
// el dominio siempre trabaja en Celsius; aquí solo se adapta a la unidad elegida.

export type TemperatureUnit = 'celsius' | 'fahrenheit';

export const celsiusToFahrenheit = (celsius: number): number =>
  celsius * 1.8 + 32;

export const fahrenheitToCelsius = (fahrenheit: number): number =>
  (fahrenheit - 32) / 1.8;

/** Redondea a la precisión típica del método (2 decimales en °C). */
export const roundToPrecision = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** '36.85 °C' / '98.33 °F'. `null` → guion. */
export const formatTemperature = (
  celsius: number | null | undefined,
  unit: TemperatureUnit
): string => {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) {
    return '—';
  }
  if (unit === 'fahrenheit') {
    return `${roundToPrecision(celsiusToFahrenheit(celsius), 2).toFixed(2)} °F`;
  }
  return `${roundToPrecision(celsius, 2).toFixed(2)} °C`;
};

/**
 * Parsea lo que la usuaria escribe (en su unidad) y devuelve °C, o `null` si no
 * es un número válido. Acepta coma o punto decimal.
 */
export const parseTemperatureInput = (
  raw: string,
  unit: TemperatureUnit
): number | null => {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '' || !/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (Number.isNaN(value)) return null;
  const celsius = unit === 'fahrenheit' ? fahrenheitToCelsius(value) : value;
  return roundToPrecision(celsius, 2);
};
