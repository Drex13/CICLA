// src/domain/entities/DomainError.ts
// Error del dominio como dato inmutable (nunca se lanza como excepción — regla R05).
// Se transporta dentro de Result<T, DomainError>.

export type DomainErrorCode =
  | 'VALIDATION_ERROR' // Input malformado o fuera de contrato
  | 'TEMPERATURE_OUT_OF_RANGE' // Temp basal fuera de [MIN, MAX]
  | 'CYCLE_TOO_SHORT' // Ciclo por debajo de MIN_CYCLE_LENGTH_DAYS
  | 'CYCLE_TOO_LONG' // Ciclo por encima de MAX_CYCLE_LENGTH_DAYS
  | 'INSUFFICIENT_DATA' // Menos de MIN_CYCLES_FOR_CALCULATION ciclos
  | 'NO_ACTIVE_CYCLE' // Se esperaba un ciclo activo y no hay
  | 'NOT_FOUND' // La entidad pedida no existe
  | 'DUPLICATE_ENTRY' // Ya existe un registro para esa fecha
  | 'PERSISTENCE_ERROR' // Fallo en la capa de datos
  | 'UNKNOWN';

export interface DomainError {
  readonly code: DomainErrorCode;
  /** Mensaje técnico para logs/debug. El texto para la usuaria lo arma el ViewModel. */
  readonly message: string;
  /** Contexto adicional serializable (valores fuera de rango, ids, etc.). */
  readonly details?: Readonly<Record<string, unknown>>;
}

/** Crea un DomainError. `details` se omite si no se pasa (exactOptionalPropertyTypes). */
export const domainError = (
  code: DomainErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>
): DomainError =>
  details === undefined ? { code, message } : { code, message, details };

// Atajos para los errores más frecuentes del núcleo STM.
export const validationError = (
  message: string,
  details?: Readonly<Record<string, unknown>>
): DomainError => domainError('VALIDATION_ERROR', message, details);

export const notFoundError = (
  message: string,
  details?: Readonly<Record<string, unknown>>
): DomainError => domainError('NOT_FOUND', message, details);

export const persistenceError = (
  message: string,
  details?: Readonly<Record<string, unknown>>
): DomainError => domainError('PERSISTENCE_ERROR', message, details);
