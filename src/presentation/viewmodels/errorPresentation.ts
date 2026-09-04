// src/presentation/viewmodels/errorPresentation.ts
// DomainError → mensaje listo para mostrar a la usuaria (regla §7: el ViewModel
// arma el texto de error, no el store ni el dominio).

import type { DomainError } from '@domain/entities/DomainError';

const BY_CODE: Partial<Record<DomainError['code'], string>> = {
  NO_ACTIVE_CYCLE: 'Aún no has iniciado un ciclo. Empieza uno para registrar.',
  TEMPERATURE_OUT_OF_RANGE:
    'Esa temperatura está fuera de rango. Revisa la medición.',
  CYCLE_TOO_SHORT: 'El ciclo anterior sería demasiado corto para ser válido.',
  INSUFFICIENT_DATA:
    'Necesitas al menos 3 ciclos completos para un cálculo fiable.',
  DUPLICATE_ENTRY: 'Ya hay un registro para ese día.',
  NOT_FOUND: 'No se encontró el dato solicitado.',
  PERSISTENCE_ERROR: 'No se pudo guardar. Inténtalo de nuevo.',
};

export const domainErrorToMessage = (error: DomainError): string =>
  BY_CODE[error.code] ?? error.message;
