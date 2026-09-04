// https://docs.expo.dev/guides/using-eslint/
// Config plana (ESLint 9). Además del preset de Expo + Prettier, aquí se
// codifican las reglas de frontera entre capas (R01, R02) de la sección 10.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

// ─── Patrones de import prohibidos por capa ──────────────────────────
// El dominio es el núcleo puro: sin React, sin Expo, sin WatermelonDB, sin
// estado, sin capas externas. Cualquier violación es un error arquitectónico.
const FORBIDDEN_IN_DOMAIN = [
  {
    group: [
      'react',
      'react-*',
      'react-native',
      'react-native/*',
      'expo',
      'expo-*',
      'expo/*',
      '@react-navigation/*',
      'zustand',
      'zustand/*',
      '@nozbe/watermelondb',
      '@nozbe/watermelondb/*',
      '@data/*',
      '@stores/*',
      '@viewmodels/*',
      '@components/*',
      '@infrastructure/*',
      '**/data/*',
      '**/presentation/*',
      '**/infrastructure/*',
    ],
    message:
      'El Domain Layer no puede importar de React/Expo/WatermelonDB ni de otras capas (regla R01).',
  },
];

// La capa de datos implementa contratos del dominio, pero no conoce la UI.
const FORBIDDEN_IN_DATA = [
  {
    group: [
      'react',
      'react-native',
      'react-native/*',
      'zustand',
      'zustand/*',
      '@stores/*',
      '@viewmodels/*',
      '@components/*',
      '**/presentation/*',
    ],
    message:
      'El Data Layer no puede importar de la capa de presentación (regla de dependencia, sección 2.2).',
  },
];

// Ningún componente de UI hace queries ni toca la DB ni los UseCases directamente.
const FORBIDDEN_IN_COMPONENTS = [
  {
    group: [
      '@nozbe/watermelondb',
      '@nozbe/watermelondb/*',
      '@data/*',
      '**/data/*',
      '@domain/usecases/*',
      '@domain/repositories/*',
    ],
    message:
      'Un componente de UI solo habla con stores/viewmodels; nada de DB, UseCases ni repositorios (regla R02).',
  },
];

// Stores y ViewModels orquestan UseCases, pero no acceden a la DB.
const FORBIDDEN_IN_PRESENTATION_LOGIC = [
  {
    group: [
      '@nozbe/watermelondb',
      '@nozbe/watermelondb/*',
      '@data/*',
      '**/data/*',
    ],
    message:
      'Stores y ViewModels no acceden a la capa de datos directamente; van por los contratos del dominio (regla R03).',
  },
];

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'android/*', 'ios/*'],
  },
  {
    // Núcleo de negocio — máximo aislamiento.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: FORBIDDEN_IN_DOMAIN }],
    },
  },
  {
    files: ['src/data/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: FORBIDDEN_IN_DATA }],
    },
  },
  {
    files: ['src/presentation/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: FORBIDDEN_IN_COMPONENTS }],
    },
  },
  {
    files: [
      'src/presentation/stores/**/*.ts',
      'src/presentation/viewmodels/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: FORBIDDEN_IN_PRESENTATION_LOGIC },
      ],
    },
  },
]);
