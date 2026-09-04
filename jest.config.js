// Fase 1: tests de lógica pura del dominio (entorno node, sin RN).
// Cuando lleguen los tests de componentes/ViewModels (Fase 3) se añadirá el
// preset `jest-expo` como segundo "project".
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  clearMocks: true,
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@stores/(.*)$': '<rootDir>/src/presentation/stores/$1',
    '^@viewmodels/(.*)$': '<rootDir>/src/presentation/viewmodels/$1',
    '^@components/(.*)$': '<rootDir>/src/presentation/components/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
  },
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    '!src/domain/**/I*.ts',
    '!src/domain/**/*.d.ts',
  ],
};
