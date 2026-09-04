// __tests__/shared/utils/temperatureUtils.test.ts

import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  formatTemperature,
  parseTemperatureInput,
  roundToPrecision,
} from '@shared/utils/temperatureUtils';

describe('temperatureUtils', () => {
  it('celsiusToFahrenheit / fahrenheitToCelsius son inversas', () => {
    expect(celsiusToFahrenheit(36.85)).toBeCloseTo(98.33, 2);
    expect(fahrenheitToCelsius(98.33)).toBeCloseTo(36.85, 2);
  });

  it('roundToPrecision redondea a la cantidad de decimales indicada', () => {
    expect(roundToPrecision(36.856, 2)).toBe(36.86);
    expect(roundToPrecision(36.851, 2)).toBe(36.85);
  });

  describe('formatTemperature', () => {
    it('formatea en Celsius con 2 decimales', () => {
      expect(formatTemperature(36.5, 'celsius')).toBe('36.50 °C');
    });

    it('formatea en Fahrenheit convirtiendo desde Celsius', () => {
      expect(formatTemperature(36.85, 'fahrenheit')).toBe('98.33 °F');
    });

    it('null/undefined/NaN se muestran como guion', () => {
      expect(formatTemperature(null, 'celsius')).toBe('—');
      expect(formatTemperature(undefined, 'celsius')).toBe('—');
      expect(formatTemperature(Number.NaN, 'celsius')).toBe('—');
    });
  });

  describe('parseTemperatureInput', () => {
    it('acepta punto o coma decimal', () => {
      expect(parseTemperatureInput('36.85', 'celsius')).toBe(36.85);
      expect(parseTemperatureInput('36,85', 'celsius')).toBe(36.85);
    });

    it('convierte desde Fahrenheit a Celsius', () => {
      expect(parseTemperatureInput('98.33', 'fahrenheit')).toBeCloseTo(
        36.85,
        2
      );
    });

    it('rechaza texto no numérico o vacío', () => {
      expect(parseTemperatureInput('abc', 'celsius')).toBeNull();
      expect(parseTemperatureInput('', 'celsius')).toBeNull();
      expect(parseTemperatureInput('   ', 'celsius')).toBeNull();
    });
  });
});
