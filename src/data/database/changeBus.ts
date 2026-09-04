// src/data/database/changeBus.ts
// Bus de notificación de cambios de la base de datos. Los repositorios lo
// disparan tras cada escritura; los métodos observe*() lo usan para re-emitir.
// App local-first de un solo proceso: todas las escrituras pasan por los repos,
// así que este bus basta para la reactividad (no hace falta el listener nativo).

export class DatabaseChangeBus {
  private readonly listeners = new Set<() => void>();

  emit(): void {
    // Copia defensiva: un listener podría desuscribirse durante la iteración.
    for (const listener of [...this.listeners]) listener();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
