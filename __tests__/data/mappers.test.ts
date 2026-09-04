// __tests__/data/mappers.test.ts
// Un test por campo crítico de los mappers (doc §11.1): DB row ↔ domain entity.

import { CycleDayMapper } from '@data/mappers/CycleDayMapper';
import { CycleMapper } from '@data/mappers/CycleMapper';
import type { CycleDayRow, CycleRow } from '@data/database/schema';
import type { CycleDayDraft } from '@domain/repositories/ICycleDayRepository';

describe('CycleDayMapper', () => {
  const meta = {
    id: 'day-1',
    createdAt: new Date(2026, 4, 12, 7),
    updatedAt: new Date(2026, 4, 12, 7),
  };

  it('toPersistence: opcionales ausentes → NULL en columnas', () => {
    const d: CycleDayDraft = {
      cycleId: 'c1',
      date: new Date(2026, 4, 12),
      dayNumber: 12,
      mucusType: 'creamy',
      isPeakDay: false,
      notes: 'hola',
    };
    const row = CycleDayMapper.toPersistence(d, meta);
    expect(row.basalTemp).toBeNull();
    expect(row.bleedingLevel).toBeNull();
    expect(row.cervixHeight).toBeNull();
    expect(row.date).toBe(new Date(2026, 4, 12).getTime());
    expect(row.isPeakDay).toBe(false);
  });

  it('toPersistence: cervixPosition → 3 columnas', () => {
    const d: CycleDayDraft = {
      cycleId: 'c1',
      date: new Date(2026, 4, 12),
      dayNumber: 12,
      mucusType: 'egg_white',
      isPeakDay: true,
      notes: '',
      basalTemp: 36.72,
      bleedingLevel: 'light',
      cervixPosition: {
        height: 'medium',
        opening: 'slightly_open',
        firmness: 'medium',
      },
    };
    const row = CycleDayMapper.toPersistence(d, meta);
    expect(row.basalTemp).toBe(36.72);
    expect(row.bleedingLevel).toBe('light');
    expect(row.cervixOpening).toBe('slightly_open');
  });

  it('toDomain: NULLs → claves ausentes; timestamps → Date', () => {
    const row: CycleDayRow = {
      id: 'x',
      cycleId: 'c1',
      date: new Date(2026, 4, 12).getTime(),
      dayNumber: 12,
      basalTemp: null,
      mucusType: 'sticky',
      bleedingLevel: null,
      cervixHeight: null,
      cervixOpening: null,
      cervixFirmness: null,
      isPeakDay: false,
      notes: '',
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_100_000,
    };
    const entity = CycleDayMapper.toDomain(row);
    expect('basalTemp' in entity).toBe(false);
    expect('cervixPosition' in entity).toBe(false);
    expect(entity.date).toBeInstanceOf(Date);
    expect(entity.updatedAt.getTime()).toBe(1_700_000_100_000);
  });

  it('roundtrip toPersistence → toDomain conserva los datos', () => {
    const d: CycleDayDraft = {
      cycleId: 'c9',
      date: new Date(2026, 4, 15),
      dayNumber: 15,
      mucusType: 'watery',
      isPeakDay: false,
      notes: 'nota',
      basalTemp: 36.88,
    };
    const back = CycleDayMapper.toDomain(CycleDayMapper.toPersistence(d, meta));
    expect(back.cycleId).toBe('c9');
    expect(back.basalTemp).toBe(36.88);
    expect(back.mucusType).toBe('watery');
    expect(back.date.getTime()).toBe(d.date.getTime());
  });
});

describe('CycleMapper', () => {
  const meta = {
    id: 'cyc-1',
    createdAt: new Date(2026, 4, 1),
    updatedAt: new Date(2026, 4, 1),
  };

  it('toPersistence: ciclo activo sin endDate → NULL', () => {
    const row = CycleMapper.toPersistence(
      { startDate: new Date(2026, 4, 1), isActive: true },
      meta
    );
    expect(row.endDate).toBeNull();
    expect(row.isActive).toBe(true);
    expect(row.startDate).toBe(new Date(2026, 4, 1).getTime());
  });

  it('toDomain: endDate NULL → clave ausente; presente → Date', () => {
    const activeRow: CycleRow = {
      id: 'a',
      startDate: 1_700_000_000_000,
      endDate: null,
      isActive: true,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    };
    expect('endDate' in CycleMapper.toDomain(activeRow)).toBe(false);

    const closedRow: CycleRow = {
      ...activeRow,
      endDate: 1_700_500_000_000,
      isActive: false,
    };
    const closed = CycleMapper.toDomain(closedRow);
    expect(closed.endDate).toBeInstanceOf(Date);
    expect(closed.endDate?.getTime()).toBe(1_700_500_000_000);
  });
});
