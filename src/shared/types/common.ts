// src/shared/types/common.ts
// Patrón Result: evita try/catch en cadena y hace los errores explícitos.
// Toda función del dominio que pueda fallar retorna Result<T, E> (regla R05).

import type { DomainError } from '@domain/entities/DomainError';

export type Result<T, E = DomainError> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ success: true, value });

export const err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/** True si el Result es exitoso (type guard). */
export const isOk = <T, E>(
  result: Result<T, E>
): result is { success: true; value: T } => result.success;

/** True si el Result es un error (type guard). */
export const isErr = <T, E>(
  result: Result<T, E>
): result is { success: false; error: E } => !result.success;

// Uso en un UseCase:
//   const result = await logEntryUseCase.execute(data);
//   if (!result.success) { mostrarError(result.error); return; }
//   usarDatos(result.value);
