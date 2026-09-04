
<div align="center">

# 🌸 CICLA

**Registro del Método Sintotérmico para iOS y Android**

*Privada · Local · Sin anuncios · Sin servidores*

[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-52-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WatermelonDB](https://img.shields.io/badge/WatermelonDB-0.27-FF6B6B)](https://nozbe.github.io/WatermelonDB/)
[![License](https://img.shields.io/badge/Licencia-MIT-green)](LICENSE)

</div>

---

## ¿Qué es CICLA?

CICLA es una app móvil para llevar el registro diario del **Método Sintotérmico (STM)** — un método de planificación familiar basado en la observación de tres biomarkers del ciclo menstrual:

- 🌡️ **Temperatura basal (BBT)** — detecta la subida post-ovulatoria de progesterona
- 💧 **Moco cervical** — indica la aproximación y el pico de fertilidad
- 🔵 **Posición cervical** *(opcional)* — señal de apoyo al estado de fertilidad

La app aplica las reglas reales del STM (**Regla del Triple Térmico** + **Regla del Peak Day**) para calcular el estado de fertilidad de cada día, sin algoritmos predictivos ni machine learning — solo las reglas del método tal como están documentadas.

> ⚠️ **Aviso importante:** CICLA es una herramienta de registro y apoyo. No reemplaza la formación certificada en el Método Sintotérmico. Se recomienda aprender el método con un instructor o recurso certificado antes de usarla como guía en planificación familiar.

---

## Características

- 📋 **Registro diario rápido** — temperatura, moco, sangrado, notas, Peak Day
- 📈 **Gráfica interactiva del ciclo** — con Línea de Cobertura (LDC), iconos de moco y zonas fértil/infértil
- 🟢 **Estado de fertilidad en tiempo real** — calculado con las reglas del STM
- 📚 **Historial de ciclos** — estadísticas de duración, fase lútea y ovulación
- 🔔 **Recordatorio diario** — notificación local configurable para medir temperatura
- 💾 **Backup local** — exportar e importar datos como JSON (compatible con iCloud Drive / Files)
- 🔒 **100% local** — todos los datos se almacenan en el dispositivo, sin servidores ni cuentas

---

## Stack Tecnológico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Lenguaje | TypeScript 5.6 (strict) | Tipado fuerte, detecta errores en compilación |
| Framework | React Native 0.76 | Multiplataforma iOS + Android desde un solo código |
| Toolchain | Expo 52 + EAS Build | Build de iOS en la nube sin necesitar Mac local |
| Navegación | Expo Router 4 | File-based routing, deep linking automático |
| Estado global | Zustand 5 | Mínimo boilerplate, TypeScript nativo |
| Persistencia | WatermelonDB + SQLite | Reactivo, relacional, local-first |
| Tests | Jest + React Testing Library | Unit tests de la lógica STM |

---


**Regla de dependencia:** el Domain Layer no puede importar nada de React, Expo ni WatermelonDB. Si hay un `import` de una librería externa dentro de `/domain`, es un error arquitectónico.

---

## Instalación y Desarrollo

### Requisitos

- Node.js 18+
- npm o yarn
- Expo Go en tu teléfono (para probar en dispositivo físico)

### Setup

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/cicla.git
cd cicla

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npx expo start
```

Escanea el QR con **Expo Go** (iOS o Android) para ver la app en tu teléfono.

### Ejecutar tests

```bash
# Unit tests
npm test

# Tests con cobertura
npm run test:coverage
```

### Build para iOS (sin Mac — usando EAS Build)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Build en la nube
eas build --platform ios --profile preview
```

---

## Casos de Prueba del Algoritmo STM

El `CalculateFertilityStatusUseCase` cubre los siguientes casos:

| ID | Escenario | Estado esperado |
|----|-----------|----------------|
| STM-001 | Menos de 3 ciclos completos | `insufficient_data` |
| STM-002 | Día de menstruación | `menstruation` |
| STM-003 | Triple térmico confirmado correctamente | `thermicRuleDay` correcto |
| STM-004 | Racha de temperaturas altas interrumpida | No se activa la regla |
| STM-005 | Detección del Peak Day | Peak Day correcto |
| STM-006 | 3 días post-Peak cumplidos | `mucusRuleMet = true` |
| STM-007 | Ambas reglas cumplidas | `post_ovulatory_infertile, confirmed` |
| STM-008 | Temperatura de fiebre (>37.8°C) | Se excluye del cálculo |
| STM-009 | Ciclo corto (< 21 días) | Manejado sin crash |
| STM-010 | Temperatura faltante en un día | No rompe la regla térmica |

---

## Distribución

La app **no está en el App Store** — es un proyecto personal. Se puede instalar de dos formas:

- **TestFlight** — si tienes Apple Developer Account ($99/año)
- **AltStore / SideStore** — gratis, sin cuenta de desarrollador

---

## Hoja de Ruta

- [x] Diseño de arquitectura y documento de ingeniería
- [x] Fase 0 — Entidades del dominio y tipos base
- [x] Fase 1 — Algoritmo STM con tests completos
- [ ] Fase 2 — Capa de datos (WatermelonDB)
- [ ] Fase 3 — Stores y ViewModels
- [ ] Fase 4 — UI completa
- [ ] Fase 5 — Notificaciones, backup y distribución

---

## Licencia

MIT — ver [LICENSE](LICENSE)

---

<div align="center">

Hecho con amor para Tiana🌸

</div>
